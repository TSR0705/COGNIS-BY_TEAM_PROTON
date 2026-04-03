# Policy Generation Module

## Overview
The Policy Generation Module converts intent objects into executable policy documents with security rules. It implements a deny-overrides strategy with fail-closed defaults.

## Usage

```javascript
const { generatePolicy } = require('./generatePolicy');

// Generate policy from intent
const policy = generatePolicy(intent);
```

## Policy Structure

```typescript
{
  policy_id: string,              // Unique UUID for this policy
  intent_id: string,              // Reference to source intent
  policy_version: "v1",           // Policy schema version
  generated_at: string,           // ISO timestamp
  evaluation: {
    strategy: "deny-overrides",   // Deny rules override allow rules
    default: "deny"               // Default action is deny
  },
  rules: [                        // Ordered list of rules
    {
      id: string,                 // Unique rule identifier
      description: string,        // Human-readable description
      action: string,             // Action this rule applies to
      effect: "allow" | "deny",   // Rule effect
      conditions: [               // Conditions for rule to apply
        {
          field: string,          // Field to evaluate
          op: string,             // Operator (in, <=, not_includes)
          value?: any,            // Static value
          value_from?: string     // Dynamic value reference
        }
      ]
    }
  ]
}
```

## Rule Generation Logic

### 1. DENY_TRADE_IF_NOT_ALLOWED (Mandatory)

Always generated first. Blocks trade actions if intent doesn't permit them.

```json
{
  "id": "DENY_TRADE_IF_NOT_ALLOWED",
  "description": "Block trade if intent does not permit it",
  "action": "trade",
  "effect": "deny",
  "conditions": [
    {
      "field": "intent.allowed_actions",
      "op": "not_includes",
      "value": "trade"
    }
  ]
}
```

### 2. ALLOW_TRADE_WITH_LIMIT (Conditional)

Generated only if `intent.allowed_actions` includes "trade".

```json
{
  "id": "ALLOW_TRADE_WITH_LIMIT",
  "description": "Allow trade within asset and amount constraints",
  "action": "trade",
  "effect": "allow",
  "conditions": [
    {
      "field": "action.asset",
      "op": "in",
      "value_from": "intent.constraints.allowed_assets"
    },
    {
      "field": "action.amount",
      "op": "<=",
      "value_from": "intent.constraints.max_trade_amount"
    }
  ]
}
```

### 3. DEFAULT_DENY (Mandatory)

Always generated last. Denies all unspecified actions.

```json
{
  "id": "DEFAULT_DENY",
  "description": "Deny all unspecified actions",
  "action": "any",
  "effect": "deny",
  "conditions": []
}
```

## Rule Order

Rules are evaluated in strict order:
1. DENY_TRADE_IF_NOT_ALLOWED
2. ALLOW_TRADE_WITH_LIMIT (if applicable)
3. DEFAULT_DENY

The `deny-overrides` strategy means any deny rule will override allow rules.


## Examples

### Example 1: Trade Intent (Allowed)

**Input:**
```json
{
  "intent_id": "123e4567-e89b-12d3-a456-426614174000",
  "intent_type": "trade",
  "allowed_actions": ["trade"],
  "constraints": {
    "max_trade_amount": 100,
    "allowed_assets": ["AAPL"]
  }
}
```

**Output:**
```json
{
  "policy_id": "9098ee85-899b-4aa1-8bab-519a567d4d6b",
  "intent_id": "123e4567-e89b-12d3-a456-426614174000",
  "policy_version": "v1",
  "generated_at": "2026-04-02T20:49:42.726Z",
  "evaluation": {
    "strategy": "deny-overrides",
    "default": "deny"
  },
  "rules": [
    {
      "id": "DENY_TRADE_IF_NOT_ALLOWED",
      "effect": "deny",
      "action": "trade"
    },
    {
      "id": "ALLOW_TRADE_WITH_LIMIT",
      "effect": "allow",
      "action": "trade"
    },
    {
      "id": "DEFAULT_DENY",
      "effect": "deny",
      "action": "any"
    }
  ]
}
```

**Result:** 3 rules generated (including ALLOW rule)

---

### Example 2: Analysis Intent (Trade NOT Allowed)

**Input:**
```json
{
  "intent_id": "223e4567-e89b-12d3-a456-426614174001",
  "intent_type": "analysis",
  "allowed_actions": ["read_data"],
  "forbidden_actions": ["trade"],
  "constraints": {
    "max_trade_amount": 0,
    "allowed_assets": ["NVDA"]
  }
}
```

**Output:**
```json
{
  "policy_id": "70bbe1e4-4e59-4991-abaf-36fba5ea812d",
  "intent_id": "223e4567-e89b-12d3-a456-426614174001",
  "policy_version": "v1",
  "evaluation": {
    "strategy": "deny-overrides",
    "default": "deny"
  },
  "rules": [
    {
      "id": "DENY_TRADE_IF_NOT_ALLOWED",
      "effect": "deny",
      "action": "trade"
    },
    {
      "id": "DEFAULT_DENY",
      "effect": "deny",
      "action": "any"
    }
  ]
}
```

**Result:** 2 rules generated (NO ALLOW rule because trade not permitted)

---

## Evaluation Strategy

### Deny-Overrides

The `deny-overrides` strategy means:
- If ANY deny rule matches, the action is denied
- Allow rules only apply if NO deny rules match
- Default is deny if no rules match

### Evaluation Flow

```
1. Check DENY_TRADE_IF_NOT_ALLOWED
   ├─ If matches → DENY
   └─ If not matches → Continue

2. Check ALLOW_TRADE_WITH_LIMIT (if exists)
   ├─ If matches → ALLOW
   └─ If not matches → Continue

3. Apply DEFAULT_DENY → DENY
```

## Integration Example

```javascript
const { extractIntent } = require('../intent/extractIntent');
const { generatePolicy } = require('./generatePolicy');

// Extract intent from user input
const intent = extractIntent('Buy AAPL 100');

// Check if intent is safe
if (intent.fail_closed) {
  return { error: 'Intent validation failed', status: intent.status };
}

// Generate policy
const policy = generatePolicy(intent);

// Pass policy to enforcement module
const result = enforcePolicy(policy, intent, action);
```

## Security Considerations

1. **Fail-Closed by Default**: All policies default to deny
2. **Deny-Overrides**: Deny rules always take precedence
3. **Explicit Allow**: Trade only allowed if explicitly permitted
4. **Constraint Enforcement**: Amount and asset limits enforced
5. **No Implicit Trust**: Every action must match a rule

## Testing

Run the test suite:
```bash
cd backend
node src/policy/test-generatePolicy.js
```

## Notes

- Policy generation is deterministic (same intent → same rules)
- Policy does NOT evaluate conditions (enforcement module does that)
- Policy does NOT execute actions (execution module does that)
- Policy is a declarative specification, not executable code
