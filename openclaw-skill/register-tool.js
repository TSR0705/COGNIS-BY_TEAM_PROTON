/**
 * OpenClaw Tool Registration
 * 
 * This file registers the process_request function as a callable tool
 * in the OpenClaw agent runtime.
 * 
 * Usage:
 * 1. Import this file in your OpenClaw agent configuration
 * 2. The tool will be available to the agent for function calling
 */

const { process_request } = require('./process_request');

/**
 * Tool Registry for OpenClaw
 * 
 * This array defines all custom tools available to the agent.
 * Each tool must have: name, description, parameters schema, and function.
 */
const tools = [
  {
    // Tool identifier (used by agent to call the tool)
    name: "process_request",
    
    // Description for the agent (helps agent decide when to use this tool)
    description: "Send financial action to backend enforcement system. Use this tool to execute trades, analyze stocks, or perform any financial operation. The backend will validate, enforce policies, and execute the action.",
    
    // JSON Schema for tool parameters (OpenAI function calling format)
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
    
    // The actual function to execute
    function: process_request
  }
];

/**
 * Export for OpenClaw Runtime
 * 
 * Different OpenClaw implementations may use different export formats.
 * This provides multiple export styles for compatibility.
 */

// CommonJS export (most common)
module.exports = {
  tools,
  process_request  // Also export the function directly
};

// ES6 export (if using ES modules)
// export { tools, process_request };

/**
 * Example OpenClaw Agent Configuration
 * 
 * Add this to your OpenClaw agent config file:
 * 
 * ```javascript
 * const { tools } = require('./openclaw-skill/register-tool');
 * 
 * const agent = new OpenClawAgent({
 *   model: "gpt-4",
 *   tools: tools,  // Register custom tools
 *   systemPrompt: "You are a financial assistant..."
 * });
 * ```
 */

/**
 * Example Agent Usage
 * 
 * When the agent receives: "Buy 100 shares of Apple"
 * 
 * The agent will call:
 * ```javascript
 * process_request({
 *   user_input: "Buy 100 shares of Apple",
 *   agent_reasoning: "User wants to purchase Apple stock",
 *   proposed_action: {
 *     type: "trade",
 *     asset: "AAPL",
 *     amount: 100,
 *     side: "buy"
 *   }
 * })
 * ```
 * 
 * Backend will:
 * 1. Extract intent from "Buy 100 shares of Apple"
 * 2. Generate policy rules
 * 3. Enforce policy (ALLOW/BLOCK)
 * 4. Execute trade if allowed
 * 5. Return decision to agent
 */
