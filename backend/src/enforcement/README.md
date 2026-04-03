# Enforcement Engine

## Overview

The Enforcement Engine evaluates action requests against policy rules to make ALLOW/BLOCK decisions. It implements a deny-overrides strategy with fail-closed behavior for security.

## Purpose

- Enforce policy rules against action requests
- Evaluate conditions with multiple operators
- Provide detailed trace of rule evaluation
- Fail closed on any error or ambiguity

## Function Signature

```javascript
function enforce(request)
```

### Input

```javascript
{
  request_id: string,      // Unique request identifier
  timestamp: string,       // ISO timestamp
  intent: Object,          // Intent object from extractIntent
  policy: Object,          // Policy object from generatePolicy
  action: {                // Action to evaluate
    type: string,          // Action type (e.g., "trade", "read_data")
    asset?: string,        // Asset symbol (required for trade)
    amount?: number        // Amount (required for trade)
  }
}
```

### Output

```javascript
{
  decision: "ALLOW" | "BLOCK",  // Final decision
  matched_rule: string | null,  // ID of matched rule
  reason: string,                // Human-readable reason
  trace: [                       // Evaluation trace
    {
      rule_id: string,
      applied: boolean,
      effect?: "allow" | "deny",
      conditions?: [...],
      all_conditions_passed?: boolean
    }
  ]
}
```

## Evaluation Flow

### Step 1: Validate Action Schema

Validates that the action has required fields:
- `action.type` must be present
- Trade actions require `action.asset`
- Trade actions require `action.amount` (number)

**Fail-closed:** Invalid schema → BLOCK

### Step 2: Rule Evaluation

For each rule in `policy.rules`:
1. Check if rule applies to action type
2. Evaluate all conditions
3. Record trace
4. Apply decision logic

### Step 3: Condition Evaluation

For each condition in a rule:
1. Resolve `field` path (e.g., "intent.status")
2. Resolve expected value from `value` or `value_from`
3. Apply operator
4. Record result

**Fail-closed:** Any error → condition fails

### Step 4: Decision Logic

- **DENY rule matches** → BLOCK immediately (deny-overrides)
- **ALLOW rule matches** → ALLOW
- **No rule matches** → BLOCK (default deny)

## Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `==` | Equality check | `status == "valid"` |
| `<=` | Less than or equal | `amount <= 1000` |
| `>=` | Greater than or equal | `amount >= 100` |
| `in` | Value in array | `asset in ["AAPL", "TSLA"]` |
| `includes` | Array includes value | `allowed_actions includes "trade"` |
| `not_includes` | Array does not include | `allowed_actions not_includes "trade"` |

## Field Resolution

Supports dot-notation paths:
- `intent.status` → resolves to intent object's status field
- `action.asset` → resolves to action object's asset field
- `intent.constraints.max_trade_amount` → nested field resolution

**Fail-closed:** Path resolution error → condition fails

## Value Resolution

Conditions can specify values in two ways:

### Static Value
```javascript
{
  field: "intent.status",
  op: "==",
  value: "valid"
}
```

### Dynamic Value (value_from)
```javascript
{
  field: "action.amount",
  op: "<=",
  value_from: "intent.constraints.max_trade_amount"
}
```

**Fail-closed:** Missing both value and value_from → condition fails

## Trace Structure

The trace provides detailed information about rule evaluation:

```javascript
{
  rule_id: "ALLOW_TRADE_WITH_LIMIT",
  applied: true,
  effect: "allow",
  conditions: [
    {
      field: "action.asset",
      operator: "in",
      expected: ["AAPL", "TSLA"],
      actual: "AAPL",
      passed: true
    },
    {
      field: "action.amount",
      operator: "<=",
      expected: 1000,
      actual: 500,
      passed: true
    }
  ],
  all_conditions_passed: true
}
```

## Fail-Closed Scenarios

The engine blocks requests in these cases:

1. **Invalid Action Schema**
   - Missing `action.type`
   - Trade without `asset`
   - Trade with non-number `amount`

2. **Field Resolution Errors**
   - Path not found
   - Null/undefined in path

3. **Value Resolution Errors**
   - Missing both `value` and `value_from`
   - `value_from` path not found

4. **Operator Errors**
   - Unknown operator
   - Type mismatch (e.g., "in" with non-array)

5. **No Matching Rule**
   - Default deny applies

## Usage Example

```javascript
const { enforce } = require('./enforcement/enforce');
const { extractIntent } = require('./intent/extractIntent');
const { generatePolicy } = require('./policy/generatePolicy');

// 1. Extract intent from user input
const intent = extractIntent("Buy AAPL 500");

// 2. Generate policy from intent
const policy = generatePolicy(intent);

// 3. Create action request
const request = {
  request_id: 'req-001',
  timestamp: new Date().toISOString(),
  intent,
  policy,
  action: {
    type: 'trade',
    asset: 'AAPL',
    amount: 500
  }
};

// 4. Enforce policy
const result = enforce(request);

console.log(result.decision);  // "ALLOW" or "BLOCK"
console.log(result.reason);    // Human-readable reason
console.log(result.trace);     // Detailed evaluation trace
```

## Integration with Other Modules

### Intent Extraction Module
- Provides `intent` object
- Sets `intent.status` (valid/ambiguous/unsafe)
- Defines `intent.allowed_actions`
- Specifies `intent.constraints`

### Policy Generation Module
- Provides `policy` object
- Defines rules with conditions
- Uses `value_from` for dynamic constraints

### Enforcement Engine
- Evaluates action against policy
- Returns ALLOW/BLOCK decision
- Provides detailed trace

## Security Features

1. **Deny-Overrides Strategy**
   - DENY rules take precedence over ALLOW rules
   - First matching DENY rule blocks immediately

2. **Fail-Closed by Default**
   - Any error results in BLOCK
   - No rule match results in BLOCK

3. **Schema Validation**
   - Validates action structure before evaluation
   - Prevents malformed requests

4. **Detailed Tracing**
   - Records all rule evaluations
   - Enables audit and debugging

5. **Intent Status Check**
   - DENY_IF_INTENT_INVALID rule blocks ambiguous/unsafe intents
   - Evaluated first (highest priority)

## Error Handling

All errors result in BLOCK decisions:

```javascript
// Example: Field resolution error
{
  decision: "BLOCK",
  matched_rule: null,
  reason: "No matching rule found - default deny",
  trace: [
    {
      rule_id: "SOME_RULE",
      applied: true,
      conditions: [
        {
          field: "invalid.path",
          operator: "==",
          error: "Cannot resolve path \"invalid.path\": invalid is null/undefined",
          passed: false
        }
      ],
      all_conditions_passed: false
    }
  ]
}
```

## Performance Considerations

- **Short-circuit evaluation:** DENY rules stop evaluation immediately
- **Lazy evaluation:** Rules only evaluated if they apply to action type
- **Minimal overhead:** Simple condition evaluation with no external calls

## Testing

See test files:
- `test-enforce.js` - Basic functionality tests
- `test-integration.js` - End-to-end integration tests
- `test-operators.js` - Operator validation tests
- `qa-test.js` - Comprehensive QA scenarios

## Future Enhancements

Potential improvements:
1. Add more operators (!=, >, <, not_in, regex)
2. Add condition combinators (AND, OR, NOT)
3. Add rule priorities/weights
4. Add caching for repeated evaluations
5. Add performance metrics
6. Add rule conflict detection
