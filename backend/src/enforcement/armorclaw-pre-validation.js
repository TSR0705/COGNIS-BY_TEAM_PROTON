const config = require('../config/configLoader');
const { v4: uuidv4 } = require('uuid');

/**
 * ArmorClaw Pre-Validation Engine
 * Intercepts queries completely separately from the underlying backend business logic.
 * Security enforcement (Layer 1).
 */

function validateInput(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return { safe: true };

  const normalized = rawInput.toLowerCase().trim();
  const securityPatterns = config.getSecurityPatterns();
  const injectionPatterns = securityPatterns.prompt_injection_patterns.map(p => new RegExp(p, 'i'));

  for (const pattern of injectionPatterns) {
    if (pattern.test(normalized)) {
      return { 
        safe: false, 
        reason: 'ArmorClaw blocked malicious intent BEFORE execution (Prompt Injection Detected)' 
      };
    }
  }

  return { safe: true };
}

// Express Middleware for UI Demo mapping
function armorClawMiddleware(req, res, next) {
  const input = req.body?.input;
  const validation = validateInput(input);
  
  if (!validation.safe) {
    // Return early, Backend never executes
    const request_id = uuidv4();
    return res.status(200).json({
      request_id,
      final_status: 'blocked',
      decision: 'BLOCK',
      matched_rule: 'ARMORCLAW_PRE_VALIDATION',
      reason: validation.reason,
      execution_status: 'blocked',
      timing: { total_ms: 10 },
      intent: {
        intent_id: uuidv4(),
        intent_type: 'unknown',
        status: 'unsafe',
        scope: [],
        allowed_actions: [],
        constraints: {}
      },
      action: { type: 'none' },
      enforcement: {
        decision: 'BLOCK',
        matched_rule: 'ARMORCLAW_PRE_VALIDATION',
        reason: validation.reason
      },
      execution: {
        status: 'blocked',
        message: 'Execution skipped - Blocked by ArmorClaw'
      }
    });
  }
  
  // Input is safe, pass to Layer 2 (Backend engine)
  next();
}

module.exports = { validateInput, armorClawMiddleware };
