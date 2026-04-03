# Execution Layer

## Overview

The Execution Layer is responsible for executing approved trade actions via the Alpaca trading API. It implements strict safety checks and fail-safe behavior.

## Purpose

- Execute trades only when enforcement explicitly allows
- Validate action structure before execution
- Interface with Alpaca paper trading API
- Provide detailed execution results
- Maintain request tracking throughout execution

## Function Signature

```javascript
async function executeTrade(request, enforcementResult)
```

### Input

```javascript
{
  request: {
    request_id: string,      // Unique request identifier
    timestamp: string,       // ISO timestamp
    action: {
      type: string,          // Must be "trade"
      asset: string,         // Stock symbol (e.g., "AAPL")
      amount: number         // Quantity (shares)
    }
  },
  enforcementResult: {
    decision: "ALLOW" | "BLOCK",  // Enforcement decision
    // ... other fields
  }
}
```

### Output

```javascript
{
  request_id: string,
  timestamp: string,
  status: "success" | "blocked" | "failed",
  
  // If success:
  order_id: string,
  asset: string,
  amount: number,
  
  // If blocked:
  message: string,
  
  // If failed:
  error: string,
  details?: string
}
```

## Execution Flow

### Step 1: Safety Check (CRITICAL)

```javascript
if (enforcementResult.decision !== 'ALLOW') {
  return {
    status: 'blocked',
    message: 'Execution skipped due to enforcement'
  };
}
```

**Purpose:** Ensure only approved actions are executed  
**Fail-Safe:** Blocks execution if enforcement denies

### Step 2: Validate Action

Validates:
- `action.type === 'trade'`
- `action.asset` is present
- `action.amount` is a number

**Fail-Safe:** Returns error if validation fails

### Step 3: Check API Credentials

Verifies:
- `process.env.ALPACA_API_KEY` is set
- `process.env.ALPACA_API_SECRET` is set

**Fail-Safe:** Returns error if credentials missing

### Step 4: Build Order Payload

```javascript
{
  symbol: action.asset,
  qty: action.amount,
  side: 'buy',
  type: 'market',
  time_in_force: 'day',
  client_order_id: request_id
}
```

### Step 5: Send Request to Alpaca

```
POST https://paper-api.alpaca.markets/v2/orders
Headers:
  APCA-API-KEY-ID: <API_KEY>
  APCA-API-SECRET-KEY: <API_SECRET>
  Content-Type: application/json
```

### Step 6: Handle Response

**Success:**
```javascript
{
  status: 'success',
  order_id: response.data.id,
  asset: action.asset,
  amount: action.amount
}
```

**Error:**
```javascript
{
  status: 'failed',
  error: 'Alpaca API error',
  details: error.message
}
```

## Safety Features

### 1. Enforcement Gate
- Only executes if `decision === 'ALLOW'`
- No bypass mechanism
- Explicit check before any API call

### 2. Action Validation
- Type must be 'trade'
- Asset must be present
- Amount must be a number
- Fails fast on invalid input

### 3. Credential Verification
- Checks environment variables
- Fails before API call if missing
- No default credentials

### 4. Error Handling
- Catches all API errors
- Returns structured error response
- Includes error details for debugging

### 5. Request Tracking
- Preserves request_id throughout
- Links Alpaca order to request
- Enables end-to-end tracing

## Alpaca Integration

### API Endpoint
```
https://paper-api.alpaca.markets/v2/orders
```

### Authentication
- Header: `APCA-API-KEY-ID`
- Header: `APCA-API-SECRET-KEY`

### Order Parameters
- `symbol`: Stock ticker (e.g., "AAPL")
- `qty`: Number of shares
- `side`: "buy" (only buy supported)
- `type`: "market" (only market orders)
- `time_in_force`: "day" (order expires end of day)
- `client_order_id`: Request ID for tracking

### Response
```javascript
{
  id: "order-uuid",
  client_order_id: "req-001",
  created_at: "2026-04-03T15:00:00Z",
  symbol: "AAPL",
  qty: "10",
  side: "buy",
  type: "market",
  status: "accepted",
  // ... other fields
}
```

## Environment Configuration

### Required Variables

```bash
ALPACA_API_KEY=your_api_key_here
ALPACA_API_SECRET=your_api_secret_here
```

### Setup

1. Create Alpaca paper trading account
2. Generate API keys
3. Add to `.env` file:

```
ALPACA_API_KEY=PKxxxxxxxxxxxxxxxxxx
ALPACA_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

4. Load environment variables:

```javascript
require('dotenv').config();
```

## Usage Example

```javascript
const { executeTrade } = require('./execution/executeTrade');

// Prepare request
const request = {
  request_id: 'req-001',
  timestamp: '2026-04-03T15:00:00Z',
  action: {
    type: 'trade',
    asset: 'AAPL',
    amount: 10
  }
};

// Enforcement result (from enforce module)
const enforcementResult = {
  decision: 'ALLOW',
  matched_rule: 'ALLOW_TRADE_WITH_LIMIT',
  reason: 'Allow trade within asset and amount constraints'
};

// Execute trade
const result = await executeTrade(request, enforcementResult);

console.log(result);
// {
//   request_id: 'req-001',
//   timestamp: '2026-04-03T15:00:00Z',
//   status: 'success',
//   order_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
//   asset: 'AAPL',
//   amount: 10
// }
```

## Response Status Types

### success
- Trade executed successfully
- Alpaca returned order ID
- Order accepted by exchange

### blocked
- Enforcement decision was BLOCK
- No API call made
- Execution skipped for safety

### failed
- Invalid action structure
- Missing API credentials
- Alpaca API error
- Network error

## Error Scenarios

### Invalid Action Type
```javascript
{
  status: 'failed',
  error: 'Invalid trade action: type must be "trade"'
}
```

### Missing Asset
```javascript
{
  status: 'failed',
  error: 'Invalid trade action: missing asset'
}
```

### Invalid Amount
```javascript
{
  status: 'failed',
  error: 'Invalid trade action: amount must be a number'
}
```

### Missing Credentials
```javascript
{
  status: 'failed',
  error: 'Alpaca API credentials not configured'
}
```

### API Error
```javascript
{
  status: 'failed',
  error: 'Alpaca API error',
  details: 'symbol INVALID is not found'
}
```

## Limitations

### By Design
- **Buy only**: No sell logic implemented
- **Market orders only**: No limit orders
- **No retries**: Fails immediately on error
- **Day orders only**: No GTC or other time-in-force options
- **Paper trading only**: Uses paper trading API

### Future Enhancements
- Add sell functionality
- Add limit order support
- Add retry logic with exponential backoff
- Add order status polling
- Add position management
- Add real trading support (with additional safety)

## Integration with Other Modules

### Intent Extraction Module
- Provides user intent
- Not directly used by execution layer

### Policy Generation Module
- Generates policy rules
- Not directly used by execution layer

### Enforcement Engine
- Provides enforcement decision
- **CRITICAL**: Execution only proceeds if decision is ALLOW

### Full Pipeline
```
User Input
    ↓
Intent Extraction
    ↓
Policy Generation
    ↓
Enforcement
    ↓
Execution ← YOU ARE HERE
```

## Security Considerations

### 1. Enforcement Gate
- Never bypass enforcement check
- Always verify decision is ALLOW
- No exceptions or overrides

### 2. Credential Protection
- Store in environment variables
- Never commit to version control
- Use paper trading for development

### 3. Input Validation
- Validate all action fields
- Type check amount
- Verify asset is present

### 4. Error Disclosure
- Return generic error messages
- Include details only for debugging
- Don't expose sensitive information

### 5. Request Tracking
- Use request_id for correlation
- Enable audit trail
- Link orders to requests

## Testing

See test files:
- `test-executeTrade.js` - Basic functionality tests
- `test-integration.js` - End-to-end pipeline tests
- `test-safety.js` - Safety check validation

## Monitoring

### Key Metrics
- Execution success rate
- Blocked execution count
- Failed execution count
- API error rate
- Response time

### Logging
- Log all execution attempts
- Log enforcement decisions
- Log API errors
- Include request_id in all logs

### Alerts
- High failure rate
- API credential errors
- Repeated blocks
- Unusual trading patterns

## Troubleshooting

### "Alpaca API credentials not configured"
- Check `.env` file exists
- Verify `ALPACA_API_KEY` is set
- Verify `ALPACA_API_SECRET` is set
- Ensure `dotenv` is loaded

### "Execution skipped due to enforcement"
- Check enforcement decision
- Review policy rules
- Verify intent is valid
- Check action constraints

### "Alpaca API error"
- Check symbol is valid
- Verify market is open
- Check account status
- Review API error details

### Network Errors
- Check internet connection
- Verify Alpaca API is accessible
- Check firewall settings
- Review proxy configuration

## Dependencies

```json
{
  "axios": "^1.x.x",
  "dotenv": "^16.x.x"
}
```

## Notes

- Uses Alpaca paper trading API (no real money)
- Requires valid Alpaca account and API keys
- Market orders execute at current market price
- Orders may be rejected if market is closed
- client_order_id enables order tracking
