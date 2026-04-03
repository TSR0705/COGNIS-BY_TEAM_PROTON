# OpenClaw Custom Skill: COGNIS Integration

## Overview

This custom skill provides a secure bridge between OpenClaw agents and the COGNIS backend enforcement system.

## Architecture

```
OpenClaw Agent
      ↓
  [User Input + Proposed Action]
      ↓
process_request.js (This Skill)
      ↓
  [HTTP POST to Backend]
      ↓
COGNIS Backend (/process)
      ↓
  [Intent → Policy → Enforcement → Execution]
      ↓
  [Decision + Result]
      ↓
OpenClaw Agent (Next Action)
```

## Security Model

1. **No Local Execution**: Skill NEVER executes trades or actions locally
2. **Backend Authority**: All decisions made by COGNIS enforcement engine
3. **Fail-Closed**: Any error results in blocked/failed status
4. **Audit Trail**: All requests logged in MongoDB via backend

## Files

- `process_request.js` - Main skill implementation
- `test-skill.js` - Test suite for skill validation
- `EXAMPLES.md` - Usage examples and integration patterns
- `trade_stock.js` - Legacy placeholder (deprecated)

## Installation

### Prerequisites

```bash
# Backend must be running
cd backend
npm install
node src/app.js

# MongoDB must be connected
# Check backend/.env for MONGODB_URI
```

### Skill Setup

```bash
# Install axios if not already installed
cd openclaw-skill
npm install axios
```

## Usage

### Basic Usage

```javascript
const { process_request } = require('./process_request');

const result = await process_request({
  user_input: "Buy 100 shares of AAPL",
  agent_reasoning: "User wants to purchase Apple stock",
  proposed_action: {
    type: "trade",
    asset: "AAPL",
    amount: 100,
    side: "buy"
  }
});

console.log(result);
// {
//   decision: "ALLOW",
//   final_status: "allowed",
//   execution_status: "success",
//   matched_rule: "ALLOW_TRADE_WITH_LIMIT",
//   reason: "Trade allowed within limits"
// }
```

### Input Schema

```javascript
{
  user_input: string,        // REQUIRED: Raw user text
  agent_reasoning: string,   // OPTIONAL: Agent's analysis
  proposed_action: {         // REQUIRED: What agent wants to do
    type: string,            // "trade", "analysis", etc.
    asset: string,           // Stock symbol
    amount: number,          // Quantity
    side: string             // "buy" or "sell"
  }
}
```

### Output Schema

**Success Response:**
```javascript
{
  decision: "ALLOW" | "BLOCK",
  final_status: "allowed" | "blocked" | "failed",
  execution_status: "success" | "blocked" | "failed",
  matched_rule: string,
  reason: string
}
```

**Error Response:**
```javascript
{
  status: "failed",
  error: string
}
```

## Testing

```bash
# Start backend first
cd backend
node src/app.js

# In another terminal, run skill tests
cd openclaw-skill
node test-skill.js
```

Expected output:
```
============================================================
OpenClaw Skill Test Suite
============================================================

TEST 1: Valid Trade Request
------------------------------------------------------------
✓ PASS: Received valid response from backend

TEST 2: Blocked Analysis Request
------------------------------------------------------------
✓ PASS: Analysis correctly blocked

TEST 3: Prompt Injection Attack
------------------------------------------------------------
✓ PASS: Attack blocked by backend

TEST 4: Invalid Input Handling
------------------------------------------------------------
✓ PASS: Invalid input correctly rejected

TEST 5: Missing proposed_action
------------------------------------------------------------
✓ PASS: Missing action correctly rejected

============================================================
TEST SUMMARY
============================================================
Total Tests: 5
Passed: 5
Failed: 0
Success Rate: 100.0%
============================================================
```

## Integration with OpenClaw

### Step 1: Register Skill

Add to your OpenClaw configuration:

```javascript
{
  "skills": [
    {
      "name": "process_request",
      "path": "./openclaw-skill/process_request.js",
      "description": "Process user requests through COGNIS enforcement system"
    }
  ]
}
```

### Step 2: Agent Workflow

```javascript
// Agent receives user input
const userInput = "Buy 100 AAPL";

// Agent analyzes and proposes action
const proposedAction = {
  type: "trade",
  asset: "AAPL",
  amount: 100,
  side: "buy"
};

// Call skill
const result = await skills.process_request({
  user_input: userInput,
  agent_reasoning: "Standard trade request",
  proposed_action: proposedAction
});

// Handle result
if (result.final_status === "allowed") {
  // Inform user: trade executed
} else if (result.final_status === "blocked") {
  // Inform user: trade blocked, reason: result.reason
} else {
  // Handle error
}
```

## Error Handling

The skill handles errors gracefully:

1. **Invalid Input**: Returns `{status: "failed", error: "Invalid skill input"}`
2. **Backend Down**: Returns `{status: "failed", error: "Backend unavailable"}`
3. **Network Error**: Returns `{status: "failed", error: "Backend unavailable"}`

## Configuration

Backend URL is hardcoded to `http://localhost:5000/process`. To change:

```javascript
// In process_request.js
const BACKEND_URL = process.env.COGNIS_BACKEND_URL || 'http://localhost:5000/process';
```

## Security Notes

1. **Trust Boundary**: Backend is the trust boundary, not the skill
2. **No Bypass**: Agent cannot bypass enforcement by calling skill differently
3. **Audit Trail**: All requests logged with agent reasoning for compliance
4. **Prompt Injection**: Backend detects and blocks 13 attack patterns

## Troubleshooting

### Backend Connection Failed

```bash
# Check backend is running
curl http://localhost:5000/process -X POST -H "Content-Type: application/json" -d '{"input":"test"}'

# Check MongoDB connection
# Look for "MongoDB connected" in backend logs
```

### Skill Returns "Backend unavailable"

1. Verify backend is running on port 5000
2. Check firewall settings
3. Verify MongoDB is connected
4. Check backend logs for errors

## Next Steps

1. Run test suite to verify integration
2. Configure OpenClaw to use this skill
3. Test with real agent workflows
4. Monitor logs in MongoDB for audit trail
