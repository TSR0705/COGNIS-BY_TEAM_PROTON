const Log = require('../models/Log');

/**
 * Save request log to MongoDB
 * @param {Object} data - Complete request lifecycle data
 * @returns {Promise<void>}
 */
async function saveLog(data) {
  try {
    // Determine final_status
    let final_status;
    if (data.execution && data.execution.status === 'success') {
      final_status = 'allowed';
    } else if (data.enforcement && data.enforcement.decision === 'BLOCK') {
      final_status = 'blocked';
    } else {
      final_status = 'failed';
    }
    
    // Determine severity based on final_status
    let severity;
    if (final_status === 'allowed') {
      severity = 'INFO';
    } else if (final_status === 'blocked') {
      severity = 'WARN';
    } else {
      severity = 'ERROR';
    }
    
    // Build log document
    const logDocument = {
      request_id: data.request_id,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      source: data.source || 'api',
      event_type: data.event_type || 'REQUEST_PROCESSED',
      severity,
      final_status,
      matched_rule: data.enforcement?.matched_rule,
      
      // Input
      raw_input: (data.raw_input || "").toString().slice(0, 500),
      
      // Intent
      intent: data.intent,
      
      // Policy
      policy: data.policy ? {
        policy_id: data.policy.policy_id,
        rules_count: data.policy.rules ? data.policy.rules.length : 0
      } : undefined,
      
      // Action
      action: data.action,
      
      // Enforcement
      enforcement: data.enforcement ? {
        decision: data.enforcement.decision,
        matched_rule: data.enforcement.matched_rule,
        reason: data.enforcement.reason,
        trace: data.enforcement.trace
      } : undefined,
      
      // Execution
      execution: data.execution ? {
        status: data.execution.status,
        order_id: data.execution.order_id,
        error_type: data.execution.error_type,
        error: (data.execution.error || data.execution.details || "").toString().slice(0, 300)
      } : undefined,
      
      // Timing
      timing: data.timing ? {
        total_ms: data.timing.total_ms
      } : undefined,
      
      // Agent (OpenClaw)
      agent: data.agent || undefined
    };
    
    // Save to MongoDB
    await Log.create(logDocument);
    
  } catch (error) {
    // FAIL-SAFE: Do not throw, only log error
    console.error('Failed to save log to MongoDB:', error.message);
  }
}

module.exports = { saveLog };
