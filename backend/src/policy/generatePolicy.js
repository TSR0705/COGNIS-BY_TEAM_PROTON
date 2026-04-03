const { v4: uuidv4 } = require('uuid');
const config = require('../config/configLoader');

/**
 * Generate policy from intent
 * @param {Object} intent - Intent object from extractIntent
 * @returns {Object} Policy object with rules
 */
function generatePolicy(intent) {
  // Load policy rules from configuration
  const policyConfig = config.getPolicyRules();
  
  // Initialize policy structure
  const policy = {
    policy_id: uuidv4(),
    intent_id: intent.intent_id,
    policy_version: policyConfig.policy_version,
    generated_at: new Date().toISOString(),
    evaluation: {
      strategy: policyConfig.evaluation_strategy,
      default: policyConfig.default_decision
    },
    rules: []
  };

  // Load rules from configuration
  for (const ruleTemplate of policyConfig.rules) {
    // Skip disabled rules
    if (ruleTemplate.enabled === false) {
      continue;
    }

    // For ALLOW_TRADE_WITH_LIMIT, only add if intent permits trade
    if (ruleTemplate.id === 'ALLOW_TRADE_WITH_LIMIT') {
      if (!intent.allowed_actions.includes('trade') || 
          intent.constraints.allowed_assets.length === 0) {
        continue;
      }
    }

    // Add rule to policy
    policy.rules.push({
      id: ruleTemplate.id,
      type: ruleTemplate.type,
      priority: ruleTemplate.priority,
      description: ruleTemplate.description,
      action: ruleTemplate.action,
      effect: ruleTemplate.effect,
      conditions: ruleTemplate.conditions
    });
  }

  // Sort rules by priority (lower number = higher priority)
  policy.rules.sort((a, b) => (a.priority || 999) - (b.priority || 999));

  return policy;
}

module.exports = { generatePolicy };
