# API Routes

## Overview

The COGNIS PROTON API provides a complete pipeline for processing trading requests with intent extraction, policy generation, enforcement, and execution.

## Endpoint

```
POST /api/process
```

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API REQUEST                            │
│                    POST /api/process                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Validate Input                                     │
│  - Check request body                                       │
│  - Validate input string                                    │
│  - Generate request_id                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Extract Intent                                     │
│  - Parse user input                                         │
│  - Detect intent type (trade/analysis/monitor)             │
│  - Extract assets and amounts                               │
│  - Check for prompt injection                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Generate Policy                                    │
│  - Create security rules                                    │
│  - Set constraints                                          │
│  - Define allowed/denied actions                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Build Action                                       │
│  - Construct action object                                  │
│  - Set type, asset, amount                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Enforce Policy                                     │
│  - Evaluate rules                                           │
│  - Check conditions                                         │
│  - Return ALLOW or BLOCK                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │         │
              ALLOW │         │ BLOCK
                    │         │
                    ▼         ▼
        ┌──────────────┐  ┌──────────────┐
        │  Execute     │  │  Skip        │
        │  Trade       │  │  Execution   │
        └──────┬───────┘  └──────┬───────┘
               │                 │
               └────────┬────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: Save Log                                           │
│  - Store complete request lifecycle                         │
│  - Save to MongoDB                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 7: Return Response                                    │
│  - Build final status                                       │
│  - Format response                                          │
│  - Set HTTP status code                                     │
└─────────────────────────────────────────────────────────────┘
```

## Request Format

```json
{
  "input": "string (required)",
  "source": "string (optional, default: 'api')",
  "action": "object (optional, auto-generated if not provided)"
}
```

### Fields

- `input` (required): Natural language trading request
- `source` (optional): Request source identifier (default: "api")
- `action` (optional): Explicit action object (auto-generated from intent if not provided)

## Response Format

```json
{
  "request_id": "uuid",
  "final_status": "allowed | blocked | failed",
  "decision": "ALLOW | BLOCK",
  "matched_rule": "string",
  "reason": "string",
  "execution_status": "success | blocked | failed",
  "timing": {
    "total_ms": number
  },
  "intent": { ... },
  "action": { ... },
  "enforcement": { ... },
  "execution": { ... }
}
```

## Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Trade executed successfully |
| 400 | Bad Request | Invalid input or execution failed |
| 403 | Forbidden | Trade blocked by enforcement |
| 500 | Internal Server Error | Unexpected server error |

## Final Status Values

| Value | Meaning | HTTP Code |
|-------|---------|-----------|
| `allowed` | Trade executed successfully | 200 |
| `blocked` | Trade blocked by policy | 403 |
| `failed` | Validation or execution error | 400 |

## Examples

See [EXAMPLES.md](./EXAMPLES.md) for detailed request/response examples.

## Security Features

### Input Validation
- ✅ Strict type checking
- ✅ Required field validation
- ✅ Early rejection of invalid requests

### Prompt Injection Detection
- ✅ 13 injection patterns detected
- ✅ Automatic blocking of unsafe intents
- ✅ Fail-closed security model

### Error Handling
- ✅ No stack traces exposed
- ✅ Sanitized error messages
- ✅ Internal errors logged only

### Logging
- ✅ Complete request lifecycle logged
- ✅ Fail-safe logging (never crashes)
- ✅ MongoDB persistence

## Performance

- **Average response time:** 100-300ms
- **Intent extraction:** ~20ms
- **Policy generation:** ~10ms
- **Enforcement:** ~30ms
- **Execution:** ~50-200ms (depends on Alpaca API)
- **Logging:** ~20ms (async)

## Error Scenarios

### Invalid Input
```json
{
  "request_id": "...",
  "status": "failed",
  "error": "Invalid input"
}
```

### Blocked Trade
```json
{
  "final_status": "blocked",
  "decision": "BLOCK",
  "matched_rule": "DENY_TRADE_IF_NOT_ALLOWED",
  "execution_status": "blocked"
}
```

### Failed Execution
```json
{
  "final_status": "failed",
  "decision": "ALLOW",
  "execution_status": "failed",
  "execution": {
    "error": "Alpaca API error"
  }
}
```

## Testing

### Manual Testing

```bash
# Test allowed trade
curl -X POST http://localhost:5000/api/process \
  -H "Content-Type: application/json" \
  -d '{"input": "buy 10 shares of AAPL"}'

# Test blocked trade
curl -X POST http://localhost:5000/api/process \
  -H "Content-Type: application/json" \
  -d '{"input": "analyze TSLA stock"}'

# Test invalid input
curl -X POST http://localhost:5000/api/process \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Automated Testing

See test files in each module:
- `intent/test-*.js`
- `policy/test-*.js`
- `enforcement/test-*.js`
- `execution/test-*.js`
- `logs/test-*.js`

## Environment Variables

Required:
- `MONGODB_URI`: MongoDB connection string
- `ALPACA_API_KEY`: Alpaca API key
- `ALPACA_API_SECRET`: Alpaca API secret

Optional:
- `PORT`: Server port (default: 5000)

## Monitoring

### Health Check

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-03T20:00:00.000Z",
  "mongodb": "connected"
}
```

### Logs Query

```javascript
const Log = require('./models/Log');

// Find all blocked requests
const blocked = await Log.find({ final_status: 'blocked' });

// Find by matched_rule
const denied = await Log.find({ matched_rule: 'DENY_TRADE_IF_NOT_ALLOWED' });

// Aggregate by status
const stats = await Log.aggregate([
  { $group: { _id: '$final_status', count: { $sum: 1 } } }
]);
```

## Integration

### Frontend Integration

```javascript
async function processTrade(input) {
  const response = await fetch('http://localhost:5000/api/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input })
  });
  
  return await response.json();
}

// Usage
const result = await processTrade('buy 10 shares of AAPL');
console.log(result.final_status); // 'allowed', 'blocked', or 'failed'
```

### OpenClaw Integration

The API can be integrated with OpenClaw skills:

```javascript
// In OpenClaw skill
const result = await fetch('http://localhost:5000/api/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    input: userMessage,
    source: 'openclaw'
  })
});
```

## Architecture

### Modules

1. **Intent Extraction** (`intent/extractIntent.js`)
   - Parses natural language input
   - Detects intent type
   - Extracts assets and amounts
   - Checks for prompt injection

2. **Policy Generation** (`policy/generatePolicy.js`)
   - Creates security rules
   - Sets constraints
   - Defines allowed/denied actions

3. **Enforcement** (`enforcement/enforce.js`)
   - Evaluates policy rules
   - Checks conditions
   - Returns ALLOW or BLOCK decision

4. **Execution** (`execution/executeTrade.js`)
   - Integrates with Alpaca API
   - Executes trades
   - Handles errors

5. **Logging** (`logs/saveLog.js`)
   - Saves complete request lifecycle
   - Stores in MongoDB
   - Fail-safe behavior

### Data Flow

```
Input → Intent → Policy → Action → Enforcement → Execution → Log → Response
```

## License

Part of the COGNIS_PROTON hackathon project.
