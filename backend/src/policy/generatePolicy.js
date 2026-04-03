const { v4: uuidv4 } = require('uuid');

/**
 * Generate policy from intent
 * @param {Object} intent - Intent object from extractIntent
 * @returns {Object} Policy object with rules
 */
function generatePolicy(intent) {
  // Initialize policy structure
  const policy = {
    policy_id: uuidv4(),
    intent_id: intent.intent_id,
    policy_version: 'v1',
    generated_at: new Date().toISOString(),
    evaluation: {
      strategy: 'deny-overrides',
      default: 'deny'
    },
    rules: []
  };

  // FIX 1: DENY RULE FOR INVALID INTENT (TOP PRIORITY)
  // Block execution if intent is ambiguous or unsafe
  policy.rules.push({
    id: 'DENY_IF_INTENT_INVALID',
    type: 'security',
    description: 'Block execution if intent is ambiguous or unsafe',
    action: 'any',
    effect: 'deny',
    conditions: [
      {
        field: 'intent.status',
        op: 'in',
        value: ['ambiguous', 'unsafe']
      }
    ]
  });

  // A. DENY RULE (MANDATORY)
  // Always block trade if intent does not permit it
  policy.rules.push({
    id: 'DENY_TRADE_IF_NOT_ALLOWED',
    type: 'security',
    description: 'Block trade if intent does not permit it',
    action: 'trade',
    effect: 'deny',
    conditions: [
      {
        field: 'intent.allowed_actions',
        op: 'not_includes',
        value: 'trade'
      }
    ]
  });

  // B. ALLOW RULE (ONLY IF TRADE ALLOWED)
  // FIX 3: Add allow rule only if intent permits trade AND has assets
  if (intent.allowed_actions.includes('trade') && 
      intent.constraints.allowed_assets.length > 0) {
    policy.rules.push({
      id: 'ALLOW_TRADE_WITH_LIMIT',
      type: 'constraint',
      description: 'Allow trade within asset and amount constraints',
      action: 'trade',
      effect: 'allow',
      conditions: [
        {
          field: 'action.asset',
          op: 'in',
          value_from: 'intent.constraints.allowed_assets'
        },
        {
          field: 'action.amount',
          op: '<=',
          value_from: 'intent.constraints.max_trade_amount'
        }
      ]
    });
  }

  // C. DEFAULT DENY RULE (MANDATORY)
  // Deny all unspecified actions
  policy.rules.push({
    id: 'DEFAULT_DENY',
    type: 'default',
    description: 'Deny all unspecified actions',
    action: 'any',
    effect: 'deny',
    conditions: []
  });

  return policy;
}

module.exports = { generatePolicy };
 