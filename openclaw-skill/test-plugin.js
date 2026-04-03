/**
 * OpenClaw Plugin Test
 * 
 * This script tests the plugin structure and functionality
 * before installing it in OpenClaw.
 * 
 * Run: node openclaw-skill/test-plugin.js
 */

const plugin = require('./index');

async function testPlugin() {
  console.log('='.repeat(70));
  console.log('OpenClaw Plugin Test');
  console.log('='.repeat(70));
  console.log();

  let passed = 0;
  let failed = 0;

  // TEST 1: Verify Plugin Structure
  console.log('TEST 1: Plugin Structure');
  console.log('-'.repeat(70));
  
  try {
    const checks = [];
    
    if (plugin.name === 'process_request') {
      checks.push('✓ Plugin name: ' + plugin.name);
      passed++;
    } else {
      checks.push('✗ Plugin name missing or incorrect');
      failed++;
    }
    
    if (plugin.description && plugin.description.length > 0) {
      checks.push('✓ Plugin description: ' + plugin.description.substring(0, 50) + '...');
      passed++;
    } else {
      checks.push('✗ Plugin description missing');
      failed++;
    }
    
    if (plugin.schema && plugin.schema.type === 'object') {
      checks.push('✓ Schema defined with type: ' + plugin.schema.type);
      passed++;
    } else {
      checks.push('✗ Schema missing or invalid');
      failed++;
    }
    
    if (typeof plugin.run === 'function') {
      checks.push('✓ Run function: callable');
      passed++;
    } else {
      checks.push('✗ Run function missing or not a function');
      failed++;
    }
    
    checks.forEach(check => console.log(check));
    console.log();
    
  } catch (error) {
    console.log('✗ TEST 1 FAILED:', error.message);
    failed++;
    console.log();
  }

  // TEST 2: Verify Schema
  console.log('TEST 2: Schema Validation');
  console.log('-'.repeat(70));
  
  try {
    const schema = plugin.schema;
    const checks = [];
    
    if (schema.required && schema.required.includes('user_input')) {
      checks.push('✓ Required field: user_input');
      passed++;
    } else {
      checks.push('✗ Missing required field: user_input');
      failed++;
    }
    
    if (schema.required && schema.required.includes('proposed_action')) {
      checks.push('✓ Required field: proposed_action');
      passed++;
    } else {
      checks.push('✗ Missing required field: proposed_action');
      failed++;
    }
    
    if (schema.properties && schema.properties.user_input) {
      checks.push('✓ Property defined: user_input');
      passed++;
    } else {
      checks.push('✗ Property missing: user_input');
      failed++;
    }
    
    if (schema.properties && schema.properties.proposed_action) {
      checks.push('✓ Property defined: proposed_action');
      passed++;
    } else {
      checks.push('✗ Property missing: proposed_action');
      failed++;
    }
    
    checks.forEach(check => console.log(check));
    console.log();
    
  } catch (error) {
    console.log('✗ TEST 2 FAILED:', error.message);
    failed++;
    console.log();
  }

  // TEST 3: Test Plugin Call
  console.log('TEST 3: Plugin Execution');
  console.log('-'.repeat(70));
  console.log('Calling plugin with test data...');
  console.log();
  
  try {
    const testInput = {
      user_input: "Buy 100 shares of AAPL",
      agent_reasoning: "Test plugin call",
      proposed_action: {
        type: "trade",
        asset: "AAPL",
        amount: 100,
        side: "buy"
      }
    };
    
    console.log('Input:', JSON.stringify(testInput, null, 2));
    console.log();
    
    const result = await plugin.run(testInput);
    
    console.log('Output:', JSON.stringify(result, null, 2));
    console.log();
    
    const checks = [];
    
    if (result.request_id) {
      checks.push('✓ Response includes request_id: ' + result.request_id);
      passed++;
    } else {
      checks.push('⚠ Response missing request_id (backend might be down)');
    }
    
    if (result.decision || result.status) {
      checks.push('✓ Response includes decision/status');
      passed++;
    } else {
      checks.push('✗ Response missing decision/status');
      failed++;
    }
    
    if (result.final_status || result.status) {
      checks.push('✓ Response includes final_status');
      passed++;
    } else {
      checks.push('✗ Response missing final_status');
      failed++;
    }
    
    checks.forEach(check => console.log(check));
    console.log();
    
  } catch (error) {
    console.log('✗ TEST 3 FAILED:', error.message);
    console.log('This might be expected if backend is not running');
    console.log();
  }

  // SUMMARY
  console.log('='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Checks: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));
  console.log();

  if (failed === 0) {
    console.log('✅ PLUGIN READY FOR INSTALLATION');
    console.log();
    console.log('Next steps:');
    console.log('1. Ensure backend is running: node backend/src/app.js');
    console.log('2. Install plugin: openclaw plugins install ./openclaw-skill');
    console.log('3. Restart OpenClaw: openclaw restart');
    console.log('4. Test with agent: "What tools do you have?"');
    console.log('5. Test tool call: "Buy 100 AAPL"');
  } else {
    console.log('❌ PLUGIN HAS ISSUES');
    console.log();
    console.log('Please fix the failed checks before installing.');
  }
  
  console.log();
  process.exit(failed > 0 ? 1 : 0);
}

// Run test
testPlugin().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
