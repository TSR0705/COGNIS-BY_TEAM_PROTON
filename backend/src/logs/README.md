# Logging System

MongoDB-based logging system for tracking complete request lifecycle in the COGNIS trading system.

## Overview

The logging system captures every request from input to execution, storing:
- User input
- Intent extraction results
- Policy generation results
- Enforcement decisions
- Execution outcomes
- Performance metrics

## Features

✅ **Automatic Status Determination**
- `allowed`: Successful trade execution
- `blocked`: Enforcement blocked the request
- `failed`: Execution or validation failed

✅ **Automatic Severity Mapping**
- `INFO`: Allowed requests
- `WARN`: Blocked requests
- `ERROR`: Failed requests

✅ **Fail-Safe Design**
- Logging errors never crash the application
- Errors logged to console only
- Application continues running

✅ **Complete Data Capture**
- Full request lifecycle
- Nested objects preserved
- Arrays stored correctly

✅ **MongoDB Optimized**
- Indexed for performance
- Schema validation
- Efficient queries

## Files

- `models/Log.js` - Mongoose schema definition
- `logs/saveLog.js` - Logging function
- `logs/test-logging.js` - Test suite
- `logs/EXAMPLES.md` - Usage examples and sample documents
- `logs/QA-REPORT.md` - Test results and validation
- `logs/README.md` - This file

## Quick Start

### 1. Install Dependencies

```bash
npm install mongoose
```

### 2. Set Environment Variable

```bash
# .env
MONGODB_URI=mongodb://localhost:27017/cognis
```

### 3. Use in Your Code

```javascript
const { saveLog } = require('./logs/saveLog');

// After processing a request
await saveLog({
  request_id: 'req-001',
  timestamp: '2026-04-03T18:00:00Z',
  input: { raw_input: 'buy 10 shares of AAPL' },
  intent: intentResult,
  policy: policyResult,
  action: actionRequest,
  enforcement: enforcementResult,
  execution: executionResult,
  timing: { total_ms: 245 }
});
```

## Schema

### Required Fields

- `request_id` (String): Unique request identifier
- `timestamp` (Date): Request timestamp
- `severity` (String): INFO, WARN, or ERROR
- `final_status` (String): allowed, blocked, or failed

### Optional Fields

- `source` (String): Request source (default: "api")
- `event_type` (String): Event type (default: "REQUEST_PROCESSED")
- `input` (Object): User input data
- `intent` (Object): Intent extraction result
- `policy` (Object): Policy generation result
- `action` (Object): Action request
- `enforcement` (Object): Enforcement decision
- `execution` (Object): Execution result
- `timing` (Object): Performance metrics

## Status Determination

### final_status

```javascript
if (execution.status === "success") {
  final_status = "allowed";
} else if (enforcement.decision === "BLOCK") {
  final_status = "blocked";
} else {
  final_status = "failed";
}
```

### severity

```javascript
if (final_status === "allowed") {
  severity = "INFO";
} else if (final_status === "blocked") {
  severity = "WARN";
} else {
  severity = "ERROR";
}
```

## Querying Logs

### Find all blocked requests

```javascript
const Log = require('./models/Log');

const blocked = await Log.find({ final_status: 'blocked' })
  .sort({ timestamp: -1 })
  .limit(100);
```

### Find errors in last 24 hours

```javascript
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
const errors = await Log.find({
  severity: 'ERROR',
  timestamp: { $gte: yesterday }
});
```

### Find request by ID

```javascript
const log = await Log.findOne({ request_id: 'req-001' });
```

### Aggregate by status

```javascript
const stats = await Log.aggregate([
  {
    $group: {
      _id: '$final_status',
      count: { $sum: 1 },
      avg_time: { $avg: '$timing.total_ms' }
    }
  }
]);
```

## Indexes

The schema includes indexes for common queries:

1. `request_id` - Single field index
2. `timestamp` - Single field index
3. `final_status` - Single field index
4. `{ final_status: 1, timestamp: -1 }` - Compound index
5. `{ severity: 1, timestamp: -1 }` - Compound index
6. `{ 'enforcement.decision': 1 }` - Nested field index

## Testing

Run the test suite:

```bash
node src/logs/test-logging.js
```

**Test Coverage:** 5/5 tests passed (100%)

## Error Handling

The logging system is designed to never crash your application:

```javascript
try {
  await Log.create(logDocument);
} catch (error) {
  // FAIL-SAFE: Do not throw, only log error
  console.error('Failed to save log to MongoDB:', error.message);
}
```

If logging fails:
- ✅ No exception thrown
- ✅ Error logged to console
- ✅ Application continues running

## Production Deployment

### 1. Set MongoDB URI

```bash
export MONGODB_URI=mongodb://your-mongodb-server:27017/cognis
```

### 2. Create Indexes

Indexes are created automatically by Mongoose, but you can create them manually:

```javascript
await Log.createIndexes();
```

### 3. Monitor Logs

- Check console for logging errors
- Query logs by severity for error tracking
- Use request_id for request tracing
- Aggregate timing data for performance monitoring

## Performance

- **Average log save time:** < 50ms
- **Database operations:** Optimized with indexes
- **Memory usage:** Minimal (streaming to MongoDB)
- **Fail-safe overhead:** Negligible

## Security

✅ **No Sensitive Data Exposure**
- Errors logged to console only
- No sensitive data in error messages
- Database errors don't expose credentials

✅ **Data Validation**
- Schema enforces required fields
- Enum validation for severity/status
- Type validation for all fields

✅ **Fail-Safe Design**
- Never throws errors
- Doesn't crash application
- Logs errors for debugging

## Example Log Document

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "request_id": "req-001",
  "timestamp": "2026-04-03T18:00:00.000Z",
  "source": "api",
  "event_type": "REQUEST_PROCESSED",
  "severity": "INFO",
  "final_status": "allowed",
  "input": {
    "raw_input": "buy 10 shares of AAPL"
  },
  "intent": {
    "intent_id": "intent-001",
    "intent_type": "trade",
    "status": "valid"
  },
  "policy": {
    "policy_id": "policy-001",
    "rules_count": 4
  },
  "action": {
    "type": "trade",
    "asset": "AAPL",
    "amount": 10
  },
  "enforcement": {
    "decision": "ALLOW",
    "matched_rule": "ALLOW_TRADE_WITH_LIMIT",
    "reason": "Allow trade within asset and amount constraints",
    "trace": []
  },
  "execution": {
    "status": "success",
    "order_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  },
  "timing": {
    "total_ms": 245
  },
  "createdAt": "2026-04-03T18:00:00.245Z",
  "updatedAt": "2026-04-03T18:00:00.245Z"
}
```

## Support

For more examples and detailed documentation, see:
- `EXAMPLES.md` - Usage examples and sample documents
- `QA-REPORT.md` - Test results and validation

## License

Part of the COGNIS_PROTON hackathon project.
