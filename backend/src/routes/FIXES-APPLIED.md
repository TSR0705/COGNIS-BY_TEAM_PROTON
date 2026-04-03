# API Route - Targeted Fixes Applied

**Date:** 2026-04-03  
**File:** `routes/process.js`  
**Status:** ✅ ALL FIXES APPLIED

---

## FIX 1: CORRECT TIMESTAMP TYPE

**Purpose:** Use Date object instead of ISO string for consistency with other modules

**Location:** Line ~18

### Before:
```javascript
// STEP 2: GENERATE REQUEST METADATA
const request_id = uuidv4();
const timestamp = new Date().toISOString();
```

### After:
```javascript
// STEP 2: GENERATE REQUEST METADATA
const request_id = uuidv4();
const timestamp = new Date();
```

**Changes:**
- ✅ Changed from `new Date().toISOString()` to `new Date()`
- ✅ Consistent with enforcement and execution modules
- ✅ Logging module handles conversion to ISO string

**Benefits:**
- Consistency across all modules
- Logging module can format as needed
- Easier to work with Date objects in pipeline

---

## FIX 2: SAFE ACTION DERIVATION

**Purpose:** Safer action building with optional chaining and fallback to intent.action

**Location:** Line ~45

### Before:
```javascript
// 5.3: Build Action (from request or derive from intent)
action = req.body.action || {
  type: intent.intent_type === 'trade' ? 'trade' : 'read_data',
  asset: intent.scope[0] || null,
  amount: intent.constraints.max_trade_amount || 0
};
```

### After:
```javascript
// 5.3: Build Action (from request or derive from intent)
action = req.body.action || intent.action || {
  type: intent.intent_type === 'trade' ? 'trade' : 'none',
  asset: intent.scope?.[0] || null,
  amount: intent.amount || 0
};
```

**Changes:**
- ✅ Added `intent.action` as fallback before default object
- ✅ Changed default type from 'read_data' to 'none'
- ✅ Used optional chaining `intent.scope?.[0]` for safety
- ✅ Changed amount source from `intent.constraints.max_trade_amount` to `intent.amount`

**Benefits:**
- Safer access to intent.scope (no error if undefined)
- Supports intent.action if present
- More accurate default action type
- Simpler amount derivation

---

## FIX 3: CONSISTENT FAILURE RESPONSE

**Purpose:** Use `final_status` instead of `status` for consistency

**Location:** Line ~23

### Before:
```javascript
// STEP 3: VALIDATE INPUT (STRICT)
if (!req.body || !req.body.input || typeof req.body.input !== 'string') {
  return res.status(400).json({
    request_id,
    status: 'failed',
    error: 'Invalid input'
  });
}
```

### After:
```javascript
// STEP 3: VALIDATE INPUT (STRICT)
if (!req.body || !req.body.input || typeof req.body.input !== 'string') {
  return res.status(400).json({
    request_id,
    final_status: 'failed',
    error: 'Invalid input'
  });
}
```

**Changes:**
- ✅ Changed `status` to `final_status`
- ✅ Consistent with all other responses

**Benefits:**
- Consistent response format
- Easier for clients to parse
- Matches successful response structure

---

## FIX 4: HTTP STATUS CODE LOGIC

**Purpose:** Return 200 for failed executions (not 400) since request was valid

**Location:** Line ~135

### Before:
```javascript
// Set appropriate HTTP status code
const httpStatus = final_status === 'allowed' ? 200 : 
                   final_status === 'blocked' ? 403 : 400;
```

### After:
```javascript
// Set appropriate HTTP status code
const httpStatus = 
  final_status === 'allowed' ? 200 :
  final_status === 'blocked' ? 403 :
  200;
```

**Changes:**
- ✅ Changed default from 400 to 200
- ✅ Failed executions now return 200 (request was valid, execution failed)
- ✅ Only blocked requests return 403
- ✅ Only invalid input returns 400 (early return)

**Benefits:**
- More accurate HTTP semantics
- 200: Request processed successfully (even if execution failed)
- 403: Request blocked by policy
- 400: Invalid request format

---

## Modified Code Sections

### Section 1: Timestamp (Line ~18)

```javascript
// STEP 2: GENERATE REQUEST METADATA
const request_id = uuidv4();
const timestamp = new Date();  // ← CHANGED: Date object instead of ISO string
```

---

### Section 2: Action Derivation (Line ~45)

```javascript
// 5.3: Build Action (from request or derive from intent)
action = req.body.action || intent.action || {  // ← ADDED: intent.action fallback
  type: intent.intent_type === 'trade' ? 'trade' : 'none',  // ← CHANGED: 'none' instead of 'read_data'
  asset: intent.scope?.[0] || null,  // ← CHANGED: Optional chaining
  amount: intent.amount || 0  // ← CHANGED: Simpler amount source
};
```

---

### Section 3: Invalid Input Response (Line ~23)

```javascript
// STEP 3: VALIDATE INPUT (STRICT)
if (!req.body || !req.body.input || typeof req.body.input !== 'string') {
  return res.status(400).json({
    request_id,
    final_status: 'failed',  // ← CHANGED: 'final_status' instead of 'status'
    error: 'Invalid input'
  });
}
```

---

### Section 4: HTTP Status Code (Line ~135)

```javascript
// Set appropriate HTTP status code
const httpStatus = 
  final_status === 'allowed' ? 200 :
  final_status === 'blocked' ? 403 :
  200;  // ← CHANGED: 200 instead of 400 for failed executions
```

---

## Sample Responses

### 1. Allowed (Execution Success) - HTTP 200

```json
{
  "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "final_status": "allowed",
  "decision": "ALLOW",
  "matched_rule": "ALLOW_TRADE_WITH_LIMIT",
  "reason": "Allow trade within asset and amount constraints",
  "execution_status": "success",
  "timing": {
    "total_ms": 245
  },
  "intent": {
    "intent_id": "intent-001",
    "intent_type": "trade",
    "status": "valid",
    "scope": ["AAPL"],
    "allowed_actions": ["trade"]
  },
  "action": {
    "type": "trade",
    "asset": "AAPL",
    "amount": 10
  },
  "enforcement": {
    "decision": "ALLOW",
    "matched_rule": "ALLOW_TRADE_WITH_LIMIT",
    "reason": "Allow trade within asset and amount constraints"
  },
  "execution": {
    "status": "success",
    "order_id": "alpaca-order-123456"
  }
}
```

---

### 2. Blocked - HTTP 403

```json
{
  "request_id": "b2c3d4e5-f6g7-8901-bcde-fg2345678901",
  "final_status": "blocked",
  "decision": "BLOCK",
  "matched_rule": "DENY_TRADE_IF_NOT_ALLOWED",
  "reason": "Block trade if intent does not permit it",
  "execution_status": "blocked",
  "timing": {
    "total_ms": 89
  },
  "intent": {
    "intent_id": "intent-002",
    "intent_type": "analysis",
    "status": "valid",
    "scope": ["TSLA"],
    "allowed_actions": ["read_data"]
  },
  "action": {
    "type": "trade",
    "asset": "TSLA",
    "amount": 0
  },
  "enforcement": {
    "decision": "BLOCK",
    "matched_rule": "DENY_TRADE_IF_NOT_ALLOWED",
    "reason": "Block trade if intent does not permit it"
  },
  "execution": {
    "status": "blocked",
    "message": "Execution skipped due to enforcement"
  }
}
```

---

### 3. Failed (Execution Error) - HTTP 200

**Note:** Changed from HTTP 400 to HTTP 200 because the request was valid, but execution failed.

```json
{
  "request_id": "c3d4e5f6-g7h8-9012-cdef-gh3456789012",
  "final_status": "failed",
  "decision": "ALLOW",
  "matched_rule": "ALLOW_TRADE_WITH_LIMIT",
  "reason": "Allow trade within asset and amount constraints",
  "execution_status": "failed",
  "timing": {
    "total_ms": 567
  },
  "intent": {
    "intent_id": "intent-003",
    "intent_type": "trade",
    "status": "valid",
    "scope": ["INVALID"],
    "allowed_actions": ["trade"]
  },
  "action": {
    "type": "trade",
    "asset": "INVALID",
    "amount": 100
  },
  "enforcement": {
    "decision": "ALLOW",
    "matched_rule": "ALLOW_TRADE_WITH_LIMIT",
    "reason": "Allow trade within asset and amount constraints"
  },
  "execution": {
    "status": "failed",
    "error": "Alpaca API error"
  }
}
```

---

## HTTP Status Code Summary

| Scenario | final_status | HTTP Code | Reason |
|----------|--------------|-----------|--------|
| Trade executed | `allowed` | 200 | Success |
| Policy blocked | `blocked` | 403 | Forbidden by policy |
| Execution failed | `failed` | 200 | Request valid, execution failed |
| Invalid input | `failed` | 400 | Bad request format |

---

## Benefits Summary

### FIX 1: Timestamp Type
✅ Consistency across modules  
✅ Easier date manipulation  
✅ Logging handles formatting  

### FIX 2: Safe Action Derivation
✅ No errors on undefined scope  
✅ Supports intent.action  
✅ More accurate defaults  
✅ Simpler amount logic  

### FIX 3: Consistent Response
✅ All responses use final_status  
✅ Easier client parsing  
✅ Consistent API contract  

### FIX 4: HTTP Status Logic
✅ More accurate HTTP semantics  
✅ 200 for valid requests  
✅ 403 only for policy blocks  
✅ 400 only for invalid input  

---

## Backward Compatibility

### Breaking Changes
⚠️ Invalid input response changed from `status` to `final_status`  
⚠️ Failed execution HTTP code changed from 400 to 200  

### Non-Breaking Changes
✅ Timestamp type change (internal only)  
✅ Action derivation (more robust)  

### Migration Guide

If clients check for `status` field in error responses:

**Before:**
```javascript
if (response.data.status === 'failed') {
  // Handle error
}
```

**After:**
```javascript
if (response.data.final_status === 'failed') {
  // Handle error
}
```

If clients check HTTP status for execution failures:

**Before:**
```javascript
if (response.status === 400) {
  // Could be invalid input OR execution failure
}
```

**After:**
```javascript
if (response.status === 400) {
  // Only invalid input
}
if (response.status === 200 && response.data.final_status === 'failed') {
  // Execution failure
}
```

---

## Testing Recommendations

### Test 1: Timestamp Type
```javascript
const response = await axios.post('/api/process', { input: 'buy AAPL 10' });
// Verify response includes timing
assert(typeof response.data.timing.total_ms === 'number');
```

### Test 2: Safe Action Derivation
```javascript
// Test with intent that has no scope
const response = await axios.post('/api/process', { input: 'analyze market' });
// Should not crash, action.asset should be null
assert(response.data.action.asset === null);
```

### Test 3: Consistent Response
```javascript
const response = await axios.post('/api/process', {}, { validateStatus: () => true });
// Check for final_status instead of status
assert(response.data.final_status === 'failed');
```

### Test 4: HTTP Status Logic
```javascript
// Test execution failure
const response = await axios.post('/api/process', 
  { input: 'buy INVALID 100' }, 
  { validateStatus: () => true }
);
// Should return 200, not 400
assert(response.status === 200);
assert(response.data.final_status === 'failed');
```

---

## Conclusion

All four targeted fixes have been successfully applied:

1. ✅ Timestamp uses Date object (not ISO string)
2. ✅ Action derivation is safer with optional chaining
3. ✅ Invalid input response uses final_status
4. ✅ HTTP status code logic updated (failed = 200, not 400)

The API route is now more robust, consistent, and follows better HTTP semantics while maintaining the core pipeline logic unchanged.
