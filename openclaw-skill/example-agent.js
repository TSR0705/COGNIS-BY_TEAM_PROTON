/**
 * Example OpenClaw Agent with COGNIS Integration
 * 
 * This demonstrates how to create an OpenClaw agent that uses
 * the process_request tool to interact with the COGNIS backend.
 * 
 * Prerequisites:
 * - OpenClaw installed: npm install openclaw
 * - Backend running: node backend/src/app.js
 * - OpenAI API key configured
 */

// Import OpenClaw (adjust based on actual OpenClaw package structure)
// const { OpenClawAgent } = require('openclaw');

// Import our custom tool
const { tools, process_request } = require('./register-tool');

/**
 * Example 1: Direct Tool Registration
 * 
 * If OpenClaw uses a simple tools array:
 */
const agentConfig = {
  model: "gpt-4",
  
  // System prompt defines agent behavior
  systemPrompt: `You are a financial assistant with access to a secure trading system.

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
3. Inform user of the result (allowed/blocked/failed)`,

  // Register custom tools
  tools: tools,
  
  // Optional: Tool choice strategy
  tool_choice: "auto"  // Let agent decide when to use tools
};

/**
 * Example 2: Manual Tool Invocation
 * 
 * If you need to call the tool directly (for testing):
 */
async function testDirectCall() {
  console.log('Testing direct tool call...\n');
  
  const result = await process_request({
    user_input: "Buy 100 shares of AAPL",
    agent_reasoning: "User requested Apple stock purchase",
    proposed_action: {
      type: "trade",
      asset: "AAPL",
      amount: 100,
      side: "buy"
    }
  });
  
  console.log('Result:', JSON.stringify(result, null, 2));
  
  // Handle result
  if (result.decision === 'ALLOW') {
    console.log('\n✓ Trade allowed by backend');
    console.log('Execution status:', result.execution_status);
  } else if (result.decision === 'BLOCK') {
    console.log('\n✗ Trade blocked by backend');
    console.log('Reason:', result.reason);
  } else {
    console.log('\n⚠ Request failed');
    console.log('Error:', result.error);
  }
}

/**
 * Example 3: Agent Conversation Flow
 * 
 * Simulated agent conversation using the tool:
 */
async function simulateAgentConversation() {
  console.log('='.repeat(70));
  console.log('OpenClaw Agent Simulation');
  console.log('='.repeat(70));
  console.log();
  
  // User message
  const userMessage = "I want to buy 100 shares of Apple stock";
  console.log('User:', userMessage);
  console.log();
  
  // Agent thinks and decides to use process_request tool
  console.log('Agent: Let me process that trade request...');
  console.log();
  
  // Agent calls the tool
  const toolCall = {
    user_input: userMessage,
    agent_reasoning: "User wants to purchase 100 shares of Apple (AAPL). This is a standard buy order.",
    proposed_action: {
      type: "trade",
      asset: "AAPL",
      amount: 100,
      side: "buy"
    }
  };
  
  console.log('Agent calls process_request with:');
  console.log(JSON.stringify(toolCall, null, 2));
  console.log();
  
  // Execute tool
  const result = await process_request(toolCall);
  
  console.log('Backend response:');
  console.log(JSON.stringify(result, null, 2));
  console.log();
  
  // Agent interprets result and responds to user
  if (result.decision === 'ALLOW') {
    if (result.execution_status === 'success') {
      console.log('Agent: ✓ Your trade has been executed successfully!');
      console.log(`       Request ID: ${result.request_id}`);
      console.log(`       100 shares of AAPL purchased`);
    } else if (result.execution_status === 'failed') {
      console.log('Agent: ⚠ Your trade was approved but execution failed.');
      console.log(`       This might be due to API configuration.`);
      console.log(`       Request ID: ${result.request_id}`);
    }
  } else if (result.decision === 'BLOCK') {
    console.log('Agent: ✗ I cannot execute this trade.');
    console.log(`       Reason: ${result.reason}`);
    console.log(`       Rule: ${result.matched_rule}`);
  } else {
    console.log('Agent: ⚠ There was an error processing your request.');
    console.log(`       Error: ${result.error || 'Unknown error'}`);
  }
  
  console.log();
  console.log('='.repeat(70));
}

/**
 * Example 4: Tool Schema Validation
 * 
 * Verify the tool is properly registered:
 */
function validateToolRegistration() {
  console.log('Tool Registration Validation');
  console.log('='.repeat(70));
  
  const tool = tools[0];
  
  console.log('✓ Tool name:', tool.name);
  console.log('✓ Tool description:', tool.description);
  console.log('✓ Required parameters:', tool.parameters.required);
  console.log('✓ Function callable:', typeof tool.function === 'function');
  
  // Validate schema
  const schema = tool.parameters;
  console.log('\nParameter Schema:');
  console.log('- user_input:', schema.properties.user_input.type);
  console.log('- agent_reasoning:', schema.properties.agent_reasoning.type);
  console.log('- proposed_action:', schema.properties.proposed_action.type);
  console.log('  - type:', schema.properties.proposed_action.properties.type.type);
  console.log('  - asset:', schema.properties.proposed_action.properties.asset.type);
  console.log('  - amount:', schema.properties.proposed_action.properties.amount.type);
  
  console.log('\n✓ Tool registration valid');
  console.log('='.repeat(70));
}

/**
 * Main execution
 */
async function main() {
  console.log('\n');
  
  // Validate tool registration
  validateToolRegistration();
  console.log('\n');
  
  // Test direct call
  await testDirectCall();
  console.log('\n');
  
  // Simulate agent conversation
  await simulateAgentConversation();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

// Export for use in other files
module.exports = {
  agentConfig,
  testDirectCall,
  simulateAgentConversation,
  validateToolRegistration
};
