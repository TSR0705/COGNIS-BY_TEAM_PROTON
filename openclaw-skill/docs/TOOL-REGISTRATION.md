# OpenClaw Tool Registration Guide

## Overview

This guide explains how to register the `process_request` custom tool in OpenClaw, making it available for agent function calling.

---

## File Structure

```
openclaw-skill/
├── process_request.js       # Core skill implementation
├── register-tool.js          # Tool registration (THIS FILE)
├── example-agent.js          # Usage examples
└── TOOL-REGISTRATION.md      # This documentation
```

---

## Tool Registration Code

### Location: `openclaw-skill/register-tool.js`

```javascript
const { process_request } = require('./process_request');

const tools = [
  {
    name: "process_request",
    
    description: "Send financial action to backend enforcement system. Use this tool to execute trades, analyze stocks, or perform any financial operation. The backend will validate, enforce policies, and execute the action.",
    
    parameters: {
      type: "object",
      properties: {
        user_input: {
          type: "string",
          description: "The raw user input text (e.g., 'Buy 100 shares of AAPL')"
        },
        agent_reasoning: {
          type: "string",
          description: "Your reasoning for this action (optional, for audit trail)"
        },
        proposed_action: {
          type: "object",
          description: "The action you want to execute",
          properties: {
            type: {
              type: "string",
              description: "Action type: 'trade', 'analysis', 'read_data', etc.",
              enum: ["trade", "analysis", "read_data", "portfolio", "market_data"]
            },
            asset: {
              type: "string",
              description: "Stock symbol (e.g., 'AAPL', 'NVDA', 'TSLA')"
            },
            amount: {
              type: "number",
              description: "Quantity or amount for the action"
            },
            side: {
              type: "string",
              description: "Trade side: 'buy' or 'sell' (optional)",
              enum: ["buy", "sell"]
            }
          },
          required: ["type", "asset", "amount"]
        }
      },
      required: ["user_input", "proposed_action"]
    },
    
    function: process_request
  }
];

module.exports = { tools, process_request };
```

---

## Integration with OpenClaw

### Method 1: Import Tools Array

```javascript
const { tools } = require('./openclaw-skill/register-tool');

const agent = new OpenClawAgent({
  model: "gpt-4",
  tools: tools,  // Register custom tools here
  systemPrompt: "You are a financial assistant..."
});
```

### Method 2: Spread into Existing Tools

```javascript
const { tools: cognisTools } = require('./openclaw-skill/register-tool');
const otherTools = [...]; // Your other tools

const agent = new OpenClawAgent({
  model: "gpt-4",
  tools: [...cognisTools, ...otherTools],
  systemPrompt: "..."
});
```

### Method 3: Direct Function Registration

```javascript
const { process_request } = require('./openclaw-skill/register-tool');

// If OpenClaw allows direct function registration
agent.registerTool({
  name: "process_request",
  description: "Send financial action to backend enforcement system",
  parameters: { /* schema */ },
  function: process_request
});
```

---

## Tool Schema (OpenAI Function Calling Format)

The tool uses OpenAI's function calling schema format:

```json
{
  "name": "process_request",
  "description": "Send financial action to backend enforcement system...",
  "parameters": {
    "type": "object",
    "properties": {
      "user_input": { "type": "string" },
      "agent_reasoning": { "type": "string" },
      "proposed_action": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["trade", "analysis", ...] },
          "asset": { "type": "string" },
          "amount": { "type": "number" },
          "side": { "type": "string", "enum": ["buy", "sell"] }
        },
        "required": ["type", "asset", "amount"]
      }
    },
    "required": ["user_input", "proposed_action"]
  }
}
```

---

## Agent System Prompt

Recommended system prompt for agents using this tool:

```
You are a financial assistant with access to a secure trading system.

Your capabilities:
- Execute stock trades (buy/sell)
- Analyze market data
- Check portfolio status

IMPORTANT RULES:
1. Always use the process_request tool for ANY financial action
2. Never execute trades locally - always go through the backend
3. Respect enforcement decisions (ALLOW/BLOCK)
4. Provide clear reasoning for your actions

When a user asks to trade:
1. Parse their request
2. Call process_request with the action
3. Inform user of the result (allowed/blocked/failed)
```

---

## Example Agent Conversation

### User Input
```
"I want to buy 100 shares of Apple stock"
```

### Agent Reasoning
```
User wants to purchase Apple (AAPL) stock. I should use the 
process_request tool to execute this trade through the backend.
```

### Tool Call
```javascript
process_request({
  user_input: "I want to buy 100 shares of Apple stock",
  agent_reasoning: "User wants to purchase 100 shares of Apple (AAPL)",
  proposed_action: {
    type: "trade",
    asset: "AAPL",
    amount: 100,
    side: "buy"
  }
})
```

### Backend Response
```javascript
{
  request_id: "abc-123",
  decision: "ALLOW",
  final_status: "allowed",
  execution_status: "success",
  matched_rule: "ALLOW_TRADE_WITH_LIMIT",
  reason: "Trade allowed within limits"
}
```

### Agent Response to User
```
✓ Your trade has been executed successfully!
  Request ID: abc-123
  100 shares of AAPL purchased
```

---

## Testing Tool Registration

### Test 1: Validate Registration

```bash
node openclaw-skill/example-agent.js
```

Expected output:
```
Tool Registration Validation
======================================================================
✓ Tool name: process_request
✓ Tool description: Send financial action to backend enforcement system...
✓ Required parameters: [ 'user_input', 'proposed_action' ]
✓ Function callable: true
```

### Test 2: Direct Tool Call

```javascript
const { process_request } = require('./openclaw-skill/register-tool');

const result = await process_request({
  user_input: "Buy 100 AAPL",
  proposed_action: {
    type: "trade",
    asset: "AAPL",
    amount: 100
  }
});

console.log(result);
// { request_id: "...", decision: "ALLOW", ... }
```

### Test 3: Agent Simulation

```bash
node openclaw-skill/example-agent.js
```

This will simulate a complete agent conversation using the tool.

---

## Tool Behavior

### Input Validation

The tool validates:
1. `user_input` is a string
2. `proposed_action` is an object
3. `proposed_action.type` is a string
4. Required fields are present

### Output Format

**Success (Allowed):**
```javascript
{
  request_id: "uuid",
  decision: "ALLOW",
  final_status: "allowed",
  execution_status: "success",
  matched_rule: "ALLOW_TRADE_WITH_LIMIT",
  reason: "Trade allowed within limits"
}
```

**Blocked:**
```javascript
{
  request_id: "uuid",
  decision: "BLOCK",
  final_status: "blocked",
  execution_status: "blocked",
  matched_rule: "DENY_TRADE_IF_NOT_ALLOWED",
  reason: "Only trade actions are allowed"
}
```

**Error:**
```javascript
{
  status: "failed",
  error: "Invalid action format"
}
```

---

## Troubleshooting

### Tool Not Appearing in Agent

**Problem:** Agent doesn't see the tool

**Solution:**
1. Verify import: `const { tools } = require('./openclaw-skill/register-tool');`
2. Check tools array is passed to agent config
3. Validate tool schema with example-agent.js

### Tool Not Callable

**Problem:** Tool appears but can't be called

**Solution:**
1. Verify function is exported: `module.exports = { tools, process_request };`
2. Check function signature matches schema
3. Test direct call: `await process_request({ ... })`

### Backend Connection Failed

**Problem:** Tool returns "Backend unavailable"

**Solution:**
1. Start backend: `node backend/src/app.js`
2. Verify endpoint: `http://localhost:5000/api/process`
3. Check network connectivity

---

## Advanced Configuration

### Custom Timeout

Modify `process_request.js`:
```javascript
timeout: 5000  // 5 seconds instead of 3
```

### Custom Backend URL

Set environment variable:
```bash
export COGNIS_BACKEND_URL=http://your-backend:5000/api/process
```

Or modify `process_request.js`:
```javascript
const BACKEND_URL = process.env.COGNIS_BACKEND_URL || 'http://localhost:5000/api/process';
```

### Additional Tool Parameters

Add to schema in `register-tool.js`:
```javascript
parameters: {
  properties: {
    // ... existing properties
    priority: {
      type: "string",
      enum: ["low", "normal", "high"],
      description: "Trade priority level"
    }
  }
}
```

---

## Security Considerations

1. **No Local Execution:** Tool never executes trades locally
2. **Backend Authority:** All decisions made by backend
3. **Audit Trail:** agent_reasoning logged for compliance
4. **Timeout Protection:** 3-second timeout prevents hanging
5. **Input Validation:** Strict schema validation

---

## Production Checklist

- [ ] Backend running and accessible
- [ ] MongoDB connected for logging
- [ ] Tool registered in agent config
- [ ] System prompt includes tool usage instructions
- [ ] Error handling tested
- [ ] Timeout behavior verified
- [ ] Audit logging enabled

---

## Support

For issues or questions:
1. Check example-agent.js for usage patterns
2. Run validation: `node openclaw-skill/example-agent.js`
3. Review test reports in openclaw-skill/
4. Check backend logs for errors

---

## Summary

**Tool Name:** `process_request`

**Purpose:** Bridge between OpenClaw agent and COGNIS backend

**Registration:** Import from `register-tool.js` and add to agent tools array

**Usage:** Agent calls tool with user_input and proposed_action

**Output:** Backend decision (ALLOW/BLOCK/FAILED) with execution result

**Status:** ✅ Production Ready
