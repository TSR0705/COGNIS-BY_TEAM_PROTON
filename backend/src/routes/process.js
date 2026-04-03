const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { extractIntent } = require('../intent/extractIntent');
const { generatePolicy } = require('../policy/generatePolicy');
const { enforce } = require('../enforcement/enforce');
const { executeTrade } = require('../execution/executeTrade');
const { saveLog } = require('../logs/saveLog');

const router = express.Router();

/**
 * POST /process
 * Complete pipeline: Intent → Policy → Enforcement → Execution
 */
router.post('/process', async (req, res) => {
  // STEP 1: START TIMER
  const startTime = Date.now();
  
  // STEP 2: GENERATE REQUEST METADATA
  const request_id = uuidv4();
  const timestamp = new Date();
  
  // STEP 3: VALIDATE INPUT (STRICT)
  if (!req.body || !req.body.input || typeof req.body.input !== 'string') {
    return res.status(400).json({
      request_id,
      final_status: 'failed',
      error: 'Invalid input'
    });
  }
  
  // STEP 4: EXTRACT RAW INPUT
  const raw_input = req.body.input;
  const source = req.body.source || 'api';
  const agentData = req.body.agent || null;
  
  // STEP 5: PIPELINE EXECUTION
  let intent, policy, action, enforcementResult, executionResult;
  
  try {
    // 5.1: Extract Intent
    intent = extractIntent(raw_input);
    
    // 5.2: Generate Policy
    policy = generatePolicy(intent);
    
    // 5.3: Build Action (from request or derive from intent)
    action = req.body.action || intent.action || {
      type: intent.intent_type === 'trade' ? 'trade' : 'none',
      asset: intent.scope?.[0] || null,
      amount: intent.amount || 0
    };
    
    // 5.4: Enforce Policy
    enforcementResult = enforce({
      request_id,
      timestamp,
      intent,
      policy,
      action
    });
    
    // 5.5: Execute Trade (if allowed)
    if (enforcementResult.decision === 'ALLOW') {
      executionResult = await executeTrade(
        { request_id, timestamp, action },
        enforcementResult
      );
    } else {
      executionResult = {
        request_id,
        timestamp,
        status: 'blocked',
        message: 'Execution skipped due to enforcement'
      };
    }
    
  } catch (error) {
    // STEP 6: CATCH ERROR
    console.error('Pipeline error:', error.message);
    executionResult = {
      request_id,
      timestamp,
      status: 'failed',
      error: 'Internal processing error'
    };
  }
  
  // STEP 7: CALCULATE TIMING
  const total_ms = Date.now() - startTime;
  
  // STEP 8: SAVE LOG (ALWAYS RUN)
  try {
    await saveLog({
      request_id,
      timestamp,
      source,
      raw_input,
      intent,
      policy,
      action,
      enforcement: enforcementResult,
      execution: executionResult,
      timing: { total_ms },
      agent: agentData
    });
  } catch (logError) {
    // Logging errors should not affect response
    console.error('Logging error:', logError.message);
  }
  
  // STEP 9: BUILD FINAL STATUS
  let final_status;
  if (executionResult?.status === 'success') {
    final_status = 'allowed';
  } else if (enforcementResult?.decision === 'BLOCK') {
    final_status = 'blocked';
  } else {
    final_status = 'failed';
  }
  
  // STEP 10: RESPONSE FORMAT (STRICT)
  // STEP 11: ERROR SAFETY - Do not expose stack traces or internal errors
  const response = {
    request_id,
    final_status,
    decision: enforcementResult?.decision,
    matched_rule: enforcementResult?.matched_rule,
    reason: enforcementResult?.reason,
    execution_status: executionResult?.status,
    timing: {
      total_ms
    },
    intent: {
      intent_id: intent?.intent_id,
      intent_type: intent?.intent_type,
      status: intent?.status,
      scope: intent?.scope,
      allowed_actions: intent?.allowed_actions
    },
    action,
    enforcement: enforcementResult ? {
      decision: enforcementResult.decision,
      matched_rule: enforcementResult.matched_rule,
      reason: enforcementResult.reason
    } : undefined,
    execution: executionResult ? {
      status: executionResult.status,
      order_id: executionResult.order_id,
      message: executionResult.message,
      error: executionResult.error
    } : undefined
  };
  
  // Set appropriate HTTP status code (always 200 for successful processing)
  const httpStatus = 200;
  
  res.status(httpStatus).json(response);
});

// STEP 11: EXPORT
module.exports = router;
