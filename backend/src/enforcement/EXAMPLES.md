# Enforcement Engine - Examples

## Example 1: ALLOWED Trade

### Input Request
```javascript
const request = {
  request_id: 'req-001',
  timestamp: '2026-04-03T10:00:00Z',
  intent: {
    intent_id: 'intent-001',
    status: 'valid',
    allowed_actions: ['trade'],
    constraints: {
      max_trade_amount: 1000,
      allowed_assets: ['AAPL', 'TSLA']
    }
  },
  policy: {
    policy_id: 'policy-001',
    rules: [
      {
        id: 'DENY_IF_INTENT_INVALID',
        type: 'security',
        action: 'any',
        effect: 'deny',
        description: 'Block execution if intent is ambiguous or unsafe',
        conditions: [
          {
            field: 'intent.status',
            op: 'in',
            value: ['ambiguous', 'unsafe']
          }
        ]
      },
      {
        id: 'DENY_TRADE_IF_NOT_ALLOWED',
        type: 'security',
        action: 'trade',
        effect: 'deny',
        description: 'Block trade if intent does not permit it',
        conditions: [
          {
            field: 'intent.allowed_actions',
            op: 'not_includes',
            value: 'trade'
          }
        ]
      },
      {
        id: 'ALLOW_TRADE_WITH_LIMIT',
        type: 'constraint',
        action: 'trade',
        effect: 'allow',
        description: 'Allow trade within asset and amount constraints',
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
      },
      {
        id: 'DEFAULT_DENY',
        type: 'default',
        action: 'any',
        effect: 'deny',
        description: 'Deny all unspecified actions',
        conditions: []
      }
    ]
  },
  action: {
    type: 'trade',
    asset: 'AAPL',
    amount: 500
  }
};
```

### Output
```javascript
{
  decision: 'ALLOW',
  matched_rule: 'ALLOW_TRADE_WITH_LIMIT',
  reason: 'Allow trade within asset and amount constraints',
  trace: [
    {
      rule_id: 'DENY_IF_INTENT_INVALID',
      applied: true,
      effect: 'deny',
      conditions: [
        {
          field: 'intent.status',
          operator: 'in',
          expected: ['ambiguous', 'unsafe'],
          actual: 'valid',
          passed: false
        }
      ],
      all_conditions_passed: false
    },
    {
      rule_id: 'DENY_TRADE_IF_NOT_ALLOWED',
      applied: true,
      effect: 'deny',
      conditions: [
        {
          field: 'intent.allowed_actions',
          operator: 'not_includes',
          expected: 'trade',
          actual: ['trade'],
          passed: false
        }
      ],
      all_conditions_passed: false
    },
    {
      rule_id: 'ALLOW_TRADE_WITH_LIMIT',
      applied: true,
      effect: 'allow',
      conditions: [
        {
          field: 'action.asset',
          operator: 'in',
          expected: ['AAPL', 'TSLA'],
          actual: 'AAPL',
          passed: true
        },
        {
          field: 'action.amount',
          operator: '<=',
          expected: 1000,
          actual: 500,
          passed: true
        }
      ],
      all_conditions_passed: true
    }
  ]
}
```

---

## Example 2: BLOCKED - Amount Exceeds Limit

### Input Request
```javascript
const request = {
  request_id: 'req-002',
  timestamp: '2026-04-03T10:05:00Z',
  intent: {
    intent_id: 'intent-002',
    status: 'valid',
    allowed_actions: ['trade'],
    constraints: {
      max_trade_amount: 1000,
      allowed_assets: ['AAPL']
    }
  },
  policy: { /* same as above */ },
  action: {
    type: 'trade',
    asset: 'AAPL',
    amount: 5000  // EXCEEDS LIMIT
  }
};
```

### Output
```javascript
{
  decision: 'BLOCK',
  matched_rule: null,
  reason: 'No matching rule found - default deny',
  trace: [
    {
      rule_id: 'DENY_IF_INTENT_INVALID',
      applied: true,
      effect: 'deny',
      conditions: [
        {
          field: 'intent.status',
          operator: 'in',
          expected: ['ambiguous', 'unsafe'],
          actual: 'valid',
          passed: false
        }
      ],
      all_conditions_passed: false
    },
    {
      rule_id: 'DENY_TRADE_IF_NOT_ALLOWED',
      applied: true,
      effect: 'deny',
      conditions: [
        {
          field: 'intent.allowed_actions',
          operator: 'not_includes',
          expected: 'trade',
          actual: ['trade'],
          passed: false
        }
      ],
      all_conditions_passed: false
    },
    {
      rule_id: 'ALLOW_TRADE_WITH_LIMIT',
      applied: true,
      effect: 'allow',
      conditions: [
        {
          field: 'action.asset',
          operator: 'in',
          expected: ['AAPL'],
          actual: 'AAPL',
          passed: true
        },
        {
          field: 'action.amount',
          operator: '<=',
          expected: 1000,
          actual: 5000,
          passed: false  // FAILED
        }
      ],
      all_conditions_passed: false
    },
    {
      rule_id: 'DEFAULT_DENY',
      applied: true,
      effect: 'deny',
      conditions: [],
      all_conditions_passed: true
    }
  ]
}
```

---

## Example 3: BLOCKED - Ambiguous Intent

### Input Request
```javascript
const request = {
  request_id: 'req-003',
  timestamp: '2026-04-03T10:10:00Z',
  intent: {
    intent_id: 'intent-003',
    status: 'ambiguous',  // AMBIGUOUS
    allowed_actions: ['trade'],
    constraints: {
      max_trade_amount: 1000,
      allowed_assets: ['AAPL']
    }
  },
  policy: { /* same as above */ },
  action: {
    type: 'trade',
    asset: 'AAPL',
    amount: 100
  }
};
```

### Output
```javascript
{
  decision: 'BLOCK',
  matched_rule: 'DENY_IF_INTENT_INVALID',
  reason: 'Block execution if intent is ambiguous or unsafe',
  trace: [
    {
      rule_id: 'DENY_IF_INTENT_INVALID',
      applied: true,
      effect: 'deny',
      conditions: [
        {
          field: 'intent.status',
          operator: 'in',
          expected: ['ambiguous', 'unsafe'],
          actual: 'ambiguous',
          passed: true  // MATCHED
        }
      ],
      all_conditions_passed: true
    }
  ]
}
```

---

## Example 4: BLOCKED - Unauthorized Asset

### Input Request
```javascript
const request = {
  request_id: 'req-004',
  timestamp: '2026-04-03T10:15:00Z',
  intent: {
    intent_id: 'intent-004',
    status: 'valid',
    allowed_actions: ['trade'],
    constraints: {
      max_trade_amount: 1000,
      allowed_assets: ['AAPL']
    }
  },
  policy: { /* same as above */ },
  action: {
    type: 'trade',
    asset: 'TSLA',  // NOT IN ALLOWED_ASSETS
    amount: 500
  }
};
```

### Output
```javascript
{
  decision: 'BLOCK',
  matched_rule: null,
  reason: 'No matching rule found - default deny',
  trace: [
    {
      rule_id: 'DENY_IF_INTENT_INVALID',
      applied: true,
      effect: 'deny',
      conditions: [
        {
          field: 'intent.status',
          operator: 'in',
          expected: ['ambiguous', 'unsafe'],
          actual: 'valid',
          passed: false
        }
      ],
      all_conditions_passed: false
    },
    {
      rule_id: 'DENY_TRADE_IF_NOT_ALLOWED',
      applied: true,
      effect: 'deny',
      conditions: [
        {
          field: 'intent.allowed_actions',
          operator: 'not_includes',
          expected: 'trade',
          actual: ['trade'],
          passed: false
        }
      ],
      all_conditions_passed: false
    },
    {
      rule_id: 'ALLOW_TRADE_WITH_LIMIT',
      applied: true,
      effect: 'allow',
      conditions: [
        {
          field: 'action.asset',
          operator: 'in',
          expected: ['AAPL'],
          actual: 'TSLA',
          passed: false  // FAILED
        },
        {
          field: 'action.amount',
          operator: '<=',
          expected: 1000,
          actual: 500,
          passed: true
        }
      ],
      all_conditions_passed: false
    },
    {
      rule_id: 'DEFAULT_DENY',
      applied: true,
      effect: 'deny',
      conditions: [],
      all_conditions_passed: true
    }
  ]
}
```

---

## Example 5: BLOCKED - Invalid Action Schema

### Input Request
```javascript
const request = {
  request_id: 'req-005',
  timestamp: '2026-04-03T10:20:00Z',
  intent: { /* valid intent */ },
  policy: { /* valid policy */ },
  action: {
    type: 'trade',
    // MISSING asset
    amount: 500
  }
};
```

### Output
```javascript
{
  decision: 'BLOCK',
  matched_rule: null,
  reason: 'Invalid action schema: trade requires asset',
  trace: []
}
```

---

## Example 6: BLOCKED - Trade Not Allowed

### Input Request
```javascript
const request = {
  request_id: 'req-006',
  timestamp: '2026-04-03T10:25:00Z',
  intent: {
    intent_id: 'intent-006',
    status: 'valid',
    allowed_actions: ['read_data'],  // NO TRADE
    forbidden_actions: ['trade'],
    constraints: {
      max_trade_amount: 0,
      allowed_assets: []
    }
  },
  policy: { /* same as above */ },
  action: {
    type: 'trade',
    asset: 'AAPL',
    amount: 100
  }
};
```

### Output
```javascript
{
  decision: 'BLOCK',
  matched_rule: 'DENY_TRADE_IF_NOT_ALLOWED',
  reason: 'Block trade if intent does not permit it',
  trace: [
    {
      rule_id: 'DENY_IF_INTENT_INVALID',
      applied: true,
      effect: 'deny',
      conditions: [
        {
          field: 'intent.status',
          operator: 'in',
          expected: ['ambiguous', 'unsafe'],
          actual: 'valid',
          passed: false
        }
      ],
      all_conditions_passed: false
    },
    {
      rule_id: 'DENY_TRADE_IF_NOT_ALLOWED',
      applied: true,
      effect: 'deny',
      conditions: [
        {
          field: 'intent.allowed_actions',
          operator: 'not_includes',
          expected: 'trade',
          actual: ['read_data'],
          passed: true  // MATCHED
        }
      ],
      all_conditions_passed: true
    }
  ]
}
```

---

## Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `==` | Equality | `actual === expected` |
| `<=` | Less than or equal | `actual <= expected` |
| `>=` | Greater than or equal | `actual >= expected` |
| `in` | Value in array | `expected.includes(actual)` |
| `includes` | Array includes value | `actual.includes(expected)` |
| `not_includes` | Array does not include value | `!actual.includes(expected)` |

---

## Fail-Closed Behavior

The enforcement engine fails closed in these scenarios:

1. **Invalid action schema** → BLOCK
2. **Missing value/value_from** → BLOCK
3. **Unknown operator** → BLOCK
4. **Field resolution error** → BLOCK
5. **No matching rule** → BLOCK (default deny)

This ensures security by default.
