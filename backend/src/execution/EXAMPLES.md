# Execution Layer - Examples

## Example 1: SUCCESS - Trade Executed

### Input
```javascript
const request = {
  request_id: 'req-001',
  timestamp: '2026-04-03T15:00:00Z',
  action: {
    type: 'trade',
    asset: 'AAPL',
    amount: 10
  }
};

const enforcementResult = {
  request_id: 'req-001',
  timestamp: '2026-04-03T15:00:00Z',
  decision: 'ALLOW',
  matched_rule: 'ALLOW_TRADE_WITH_LIMIT',
  reason: 'Allow trade within asset and amount constraints',
  trace: [...]
};
```

### Output
```javascript
{
  request_id: 'req-001',
  timestamp: '2026-04-03T15:00:00Z',
  status: 'success',
  order_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  asset: 'AAPL',
  amount: 10
}
```

---

## Example 2: BLOCKED - Enforcement Denied

### Input
```javascript
const request = {
  request_id: 'req-002',
  timestamp: '2026-04-03T15:05:00Z',
  action: {
    type: 'trade',
    asset: 'TSLA',
    amount: 5
  }
};

const enforcementResult = {
  request_id: 'req-002',
  timestamp: '2026-04-03T15:05:00Z',
  decision: 'BLOCK',
  matched_rule: 'DENY_TRADE_IF_NOT_ALLOWED',
  reason: 'Block trade if intent does not permit it',
  trace: [...]
};
```

### Output
```javascript
{
  request_id: 'req-002',
  timestamp: '2026-04-03T15:05:00Z',
  status: 'blocked',
  message: 'Execution skipped due to enforcement'
}
```

---

## Example 3: FAILED - Invalid Action (Missing Asset)

### Input
```javascript
const request = {
  request_id: 'req-003',
  timestamp: '2026-04-03T15:10:00Z',
  action: {
    type: 'trade',
    // missing asset
    amount: 10
  }
};

const enforcementResult = {
  decision: 'ALLOW'
};
```

### Output
```javascript
{
  request_id: 'req-003',
  timestamp: '2026-04-03T15:10:00Z',
  status: 'failed',
  error: 'Invalid trade action: missing asset'
}
```

---

## Example 4: FAILED - Invalid Action Type

### Input
```javascript
const request = {
  request_id: 'req-004',
  timestamp: '2026-04-03T15:15:00Z',
  action: {
    type: 'withdraw',  // NOT 'trade'
    asset: 'AAPL',
    amount: 10
  }
};

const enforcementResult = {
  decision: 'ALLOW'
};
```

### Output
```javascript
{
  request_id: 'req-004',
  timestamp: '2026-04-03T15:15:00Z',
  status: 'failed',
  error: 'Invalid trade action: type must be "trade"'
}
```

---

## Example 5: FAILED - Invalid Amount Type

### Input
```javascript
const request = {
  request_id: 'req-005',
  timestamp: '2026-04-03T15:20:00Z',
  action: {
    type: 'trade',
    asset: 'AAPL',
    amount: '10'  // STRING, not number
  }
};

const enforcementResult = {
  decision: 'ALLOW'
};
```

### Output
```javascript
{
  request_id: 'req-005',
  timestamp: '2026-04-03T15:20:00Z',
  status: 'failed',
  error: 'Invalid trade action: amount must be a number'
}
```

---

## Example 6: FAILED - Alpaca API Error

### Input
```javascript
const request = {
  request_id: 'req-006',
  timestamp: '2026-04-03T15:25:00Z',
  action: {
    type: 'trade',
    asset: 'INVALID_SYMBOL',
    amount: 10
  }
};

const enforcementResult = {
  decision: 'ALLOW'
};
```

### Output
```javascript
{
  request_id: 'req-006',
  timestamp: '2026-04-03T15:25:00Z',
  status: 'failed',
  error: 'Alpaca API error',
  details: 'symbol INVALID_SYMBOL is not found'
}
```

---

## Example 7: FAILED - Missing API Credentials

### Input
```javascript
// process.env.ALPACA_API_KEY = undefined
// process.env.ALPACA_API_SECRET = undefined

const request = {
  request_id: 'req-007',
  timestamp: '2026-04-03T15:30:00Z',
  action: {
    type: 'trade',
    asset: 'AAPL',
    amount: 10
  }
};

const enforcementResult = {
  decision: 'ALLOW'
};
```

### Output
```javascript
{
  request_id: 'req-007',
  timestamp: '2026-04-03T15:30:00Z',
  status: 'failed',
  error: 'Alpaca API credentials not configured'
}
```

---

## Alpaca Order Payload

The execution layer sends this payload to Alpaca:

```javascript
{
  symbol: 'AAPL',              // Stock symbol
  qty: 10,                     // Quantity (shares)
  side: 'buy',                 // Always 'buy' (no sell logic)
  type: 'market',              // Always 'market' (no limit orders)
  time_in_force: 'day',        // Order valid for the day
  client_order_id: 'req-001'   // Request ID for tracking
}
```

---

## Response Status Types

| Status | Description | When It Occurs |
|--------|-------------|----------------|
| `success` | Trade executed successfully | Alpaca API returns order ID |
| `blocked` | Execution skipped | Enforcement decision is BLOCK |
| `failed` | Execution failed | Invalid action or API error |

---

## Safety Features

1. **Enforcement Check**: Only executes if decision is ALLOW
2. **Action Validation**: Validates type, asset, and amount
3. **Credential Check**: Verifies API keys are configured
4. **Error Handling**: Catches and reports API errors
5. **Request Tracking**: Includes request_id in all responses

---

## Environment Variables

Required environment variables:

```bash
ALPACA_API_KEY=your_api_key_here
ALPACA_API_SECRET=your_api_secret_here
```

Set these in `.env` file:

```
ALPACA_API_KEY=PKxxxxxxxxxxxxxxxxxx
ALPACA_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Full Pipeline Example

```javascript
const { extractIntent } = require('./intent/extractIntent');
const { generatePolicy } = require('./policy/generatePolicy');
const { enforce } = require('./enforcement/enforce');
const { executeTrade } = require('./execution/executeTrade');

async function handleUserInput(userInput) {
  // 1. Extract Intent
  const intent = extractIntent(userInput);
  
  // 2. Generate Policy
  const policy = generatePolicy(intent);
  
  // 3. Create Request
  const request = {
    request_id: 'req-001',
    timestamp: new Date().toISOString(),
    intent,
    policy,
    action: {
      type: 'trade',
      asset: 'AAPL',
      amount: 10
    }
  };
  
  // 4. Enforce Policy
  const enforcementResult = enforce(request);
  
  // 5. Execute Trade
  const executionResult = await executeTrade(request, enforcementResult);
  
  return executionResult;
}

// Example usage
handleUserInput("Buy AAPL 10")
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

---

## Error Scenarios

### Scenario 1: Enforcement Blocks Trade
- **Cause**: Intent does not allow trade
- **Status**: `blocked`
- **Action**: No API call made

### Scenario 2: Invalid Action
- **Cause**: Missing required fields
- **Status**: `failed`
- **Action**: No API call made

### Scenario 3: API Credentials Missing
- **Cause**: Environment variables not set
- **Status**: `failed`
- **Action**: No API call made

### Scenario 4: Alpaca API Error
- **Cause**: Invalid symbol, insufficient funds, market closed, etc.
- **Status**: `failed`
- **Action**: API call made but failed

---

## Notes

- **Paper Trading**: Uses Alpaca paper trading API (no real money)
- **Market Orders Only**: No limit orders implemented
- **Buy Only**: No sell logic implemented
- **No Retries**: Fails immediately on error
- **Day Orders**: Orders expire at end of trading day
- **Request Tracking**: client_order_id links to request_id
