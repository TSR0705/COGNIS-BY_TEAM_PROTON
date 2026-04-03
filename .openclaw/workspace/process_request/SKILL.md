# process_request

## Description

Executes financial actions through the COGNIS backend enforcement system. This tool validates user intent, enforces trading policies, and executes trades through a secure backend API.

## Usage

Use this tool when the user wants to:
- Buy or sell stocks
- Execute any financial trade
- Perform stock trading operations

Do NOT use for:
- General stock information queries
- Market analysis without trading
- Portfolio viewing (unless executing a trade)

## Input Schema

```json
{
  "user_input": "string (required) - The raw user input text",
  "agent_reasoning": "string (optional) - Your reasoning for this action",
  "proposed_action": {
    "type": "string (required) - Action type: 'trade', 'analysis', etc.",
    "asset": "string (required) - Stock symbol (e.g., 'AAPL', 'NVDA')",
    "amount": "number (required) - Quantity to trade",
    "side": "string (optional) - 'buy' or 'sell'"
  }
}
```

## Output Schema

```json
{
  "request_id": "string - Unique request identifier",
  "decision": "string - ALLOW or BLOCK",
  "final_status": "string - allowed, blocked, or failed",
  "execution_status": "string - success, failed, or blocked",
  "matched_rule": "string - Policy rule that was matched",
  "reason": "string - Explanation of the decision"
}
```

## Command

```bash
node C:/Users/ACER/OneDrive/Desktop/COGNIS_PROTON/COGNIS_PROTON/openclaw-skill/process_request_cli.js
```

## Examples

### Example 1: Buy Stock

**Input:**
```json
{
  "user_input": "Buy 100 shares of Apple",
  "agent_reasoning": "User wants to purchase Apple stock",
  "proposed_action": {
    "type": "trade",
    "asset": "AAPL",
    "amount": 100,
    "side": "buy"
  }
}
```

**Output:**
```json
{
  "request_id": "abc-123-def",
  "decision": "ALLOW",
  "final_status": "allowed",
  "execution_status": "success",
  "matched_rule": "ALLOW_TRADE_WITH_LIMIT",
  "reason": "Trade allowed within limits"
}
```

### Example 2: Blocked Trade

**Input:**
```json
{
  "user_input": "Analyze NVDA stock",
  "agent_reasoning": "User wants analysis",
  "proposed_action": {
    "type": "trade",
    "asset": "NVDA",
    "amount": 100
  }
}
```

**Output:**
```json
{
  "request_id": "xyz-789-ghi",
  "decision": "BLOCK",
  "final_status": "blocked",
  "execution_status": "blocked",
  "matched_rule": "DENY_TRADE_IF_NOT_ALLOWED",
  "reason": "Intent does not permit trade action"
}
```

## Requirements

- Node.js installed
- Backend server running on http://localhost:5000
- MongoDB connected for logging

## Notes

- All requests are logged in MongoDB for audit trail
- Backend enforces security policies automatically
- Prompt injection attempts are detected and blocked
- 3-second timeout prevents hanging requests
