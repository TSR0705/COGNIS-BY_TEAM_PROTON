/**
 * OpenClaw Plugin: COGNIS Process Request
 * 
 * This is the main entry point for the OpenClaw plugin.
 * It wraps the process_request function and exposes it as a callable tool.
 */

const { process_request } = require('./process_request');

/**
 * OpenClaw Plugin Export
 * 
 * This structure follows OpenClaw's plugin architecture:
 * - name: Tool identifier
 * - description: What the tool does (shown to agent)
 * - schema: JSON Schema for parameters (OpenAI function calling format)
 * - run: The actual function to execute
 */
module.exports = {
  // Tool identifier (used by agent to call this tool)
  name: "process_request",
  
  // Description for the agent (helps agent decide when to use this tool)
  description: "Send financial action to backend enforcement system. Use this tool to execute trades, analyze stocks, or perform any financial operation. The backend will validate, enforce policies, and execute the action.",
  
  // JSON Schema for tool parameters (OpenAI function calling format)
  schema: {
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
  
  // The actual function that gets called when agent uses this tool
  run: async (input) => {
    // Call the underlying process_request function
    return await process_request(input);
  }
};
