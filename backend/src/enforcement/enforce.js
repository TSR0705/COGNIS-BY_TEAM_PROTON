const { v4: uuidv4 } = require('uuid');

/**
 * Enforce policy against action request
 * @param {Object} request - Request object with intent, policy, and action
 * @returns {Object} Enforcement decision with trace
 */
function enforce(request) {
  const { request_id, timestamp, intent, policy, action } = request;
  
  // Initialize trace
  const trace = [];
  
  // STEP 1: VALIDATE ACTION SCHEMA
  if (!action || !action.type) {
    return {
      request_id,
      timestamp,
      decision: 'BLOCK',
      matched_rule: null,
      reason: 'Invalid action schema: missing action.type',
      trace
    };
  }
  
  // Validate trade-specific fields
  if (action.type === 'trade') {
    if (!action.asset) {
      return {
        request_id,
        timestamp,
        decision: 'BLOCK',
        matched_rule: null,
        reason: 'Invalid action schema: trade requires asset',
        trace
      };
    }
    
    if (typeof action.amount !== 'number') {
      return {
        request_id,
        timestamp,
        decision: 'BLOCK',
        matched_rule: null,
        reason: 'Invalid action schema: amount must be a number',
        trace
      };
    }
  }
  
  // STEP 2-5: RULE EVALUATION
  for (const rule of policy.rules) {
    // Check if rule applies to this action
    const ruleApplies = rule.action === action.type || rule.action === 'any';
    
    if (!ruleApplies) {
      trace.push({
        rule_id: rule.id,
        applied: false,
        reason: `Rule action "${rule.action}" does not match action type "${action.type}"`
      });
      continue;
    }
    
    // STEP 3: CONDITION EVALUATION
    let allConditionsPassed = true;
    const conditionResults = [];
    
    for (const condition of rule.conditions) {
      try {
        // Resolve the actual value to check
        const actualValue = resolveFieldPath(condition.field, { intent, action });
        
        // Resolve the expected value
        let expectedValue;
        if (condition.value !== undefined) {
          expectedValue = condition.value;
        } else if (condition.value_from) {
          expectedValue = resolveFieldPath(condition.value_from, { intent, action });
        } else {
          // Fail-closed: missing value/value_from
          throw new Error('Condition missing both value and value_from');
        }
        
        // Evaluate condition based on operator
        const conditionPassed = evaluateCondition(actualValue, condition.op, expectedValue);
        
        conditionResults.push({
          field: condition.field,
          operator: condition.op,
          expected: expectedValue,
          actual: actualValue,
          passed: conditionPassed
        });
        
        if (!conditionPassed) {
          allConditionsPassed = false;
        }
      } catch (error) {
        // Fail-closed: any error in condition evaluation
        conditionResults.push({
          field: condition.field,
          operator: condition.op,
          error: error.message,
          passed: false
        });
        allConditionsPassed = false;
      }
    }
    
    // STEP 4: TRACE BUILDING
    trace.push({
      rule_id: rule.id,
      applied: true,
      effect: rule.effect,
      conditions: conditionResults,
      all_conditions_passed: allConditionsPassed
    });
    
    // STEP 5: DECISION LOGIC
    if (allConditionsPassed) {
      if (rule.effect === 'deny') {
        // DENY rule matched - BLOCK immediately
        return {
          request_id,
          timestamp,
          decision: 'BLOCK',
          matched_rule: rule.id,
          reason: rule.description,
          trace
        };
      } else if (rule.effect === 'allow') {
        // ALLOW rule matched - ALLOW
        return {
          request_id,
          timestamp,
          decision: 'ALLOW',
          matched_rule: rule.id,
          reason: rule.description,
          trace
        };
      }
    }
  }
  
  // STEP 6: DEFAULT DECISION (FAIL-CLOSED)
  // No rule matched - BLOCK by default
  return {
    request_id,
    timestamp,
    decision: 'BLOCK',
    matched_rule: 'DEFAULT_DENY',
    reason: 'Deny all unspecified actions',
    trace
  };
}

/**
 * Resolve field path like "intent.status" or "action.asset"
 * @param {string} path - Dot-notation path
 * @param {Object} context - Context object with intent, action, etc.
 * @returns {*} Resolved value
 */
function resolveFieldPath(path, context) {
  const parts = path.split('.');
  let current = context;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      throw new Error(`Cannot resolve path "${path}": ${part} is null/undefined`);
    }
    current = current[part];
  }
  
  if (current === undefined) {
    throw new Error(`Cannot resolve path "${path}": value is undefined`);
  }
  
  return current;
}

/**
 * Evaluate condition based on operator
 * @param {*} actual - Actual value
 * @param {string} operator - Comparison operator
 * @param {*} expected - Expected value
 * @returns {boolean} True if condition passes
 */
function evaluateCondition(actual, operator, expected) {
  switch (operator) {
    case '==':
      return actual === expected;
    
    case '<=':
      return actual <= expected;
    
    case '>=':
      return actual >= expected;
    
    case 'in':
      // Check if actual is in expected array
      if (!Array.isArray(expected)) {
        throw new Error('Operator "in" requires expected value to be an array');
      }
      return expected.includes(actual);
    
    case 'includes':
      // Check if actual array includes expected value
      if (!Array.isArray(actual)) {
        throw new Error('Operator "includes" requires actual value to be an array');
      }
      return actual.includes(expected);
    
    case 'not_includes':
      // Check if actual array does NOT include expected value
      if (!Array.isArray(actual)) {
        throw new Error('Operator "not_includes" requires actual value to be an array');
      }
      return !actual.includes(expected);
    
    default:
      // Fail-closed: unknown operator
      throw new Error(`Unknown operator: ${operator}`);
  }
}

module.exports = { enforce };
