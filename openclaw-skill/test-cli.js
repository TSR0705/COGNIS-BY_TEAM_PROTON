/**
 * Test CLI Wrapper
 * 
 * This script tests the process_request_cli.js wrapper
 * to ensure it works correctly with OpenClaw.
 */

const { spawn } = require('child_process');
const path = require('path');

async function testCLI(testName, input, expectedFields) {
  console.log(`\nTesting: ${testName}`);
  console.log('-'.repeat(70));
  
  return new Promise((resolve) => {
    const cli = spawn('node', [path.join(__dirname, 'process_request_cli.js')]);
    
    let output = '';
    let error = '';
    
    cli.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    cli.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    cli.on('close', (code) => {
      console.log('Input:', JSON.stringify(input));
      console.log('Output:', output);
      
      if (error) {
        console.log('Error:', error);
      }
      
      try {
        const result = JSON.parse(output);
        let passed = true;
        
        for (const field of expectedFields) {
          if (result[field]) {
            console.log(`✓ ${field}: ${result[field]}`);
          } else {
            console.log(`✗ ${field}: missing`);
            passed = false;
          }
        }
        
        console.log(passed ? '✓ TEST PASSED' : '✗ TEST FAILED');
        resolve(passed);
      } catch (e) {
        console.log('✗ TEST FAILED: Invalid JSON output');
        resolve(false);
      }
    });
    
    // Send input
    cli.stdin.write(JSON.stringify(input));
    cli.stdin.end();
  });
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('CLI Wrapper Test Suite');
  console.log('='.repeat(70));
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Valid trade
  const test1 = await testCLI(
    'Valid Trade Request',
    {
      user_input: "Buy 100 shares of AAPL",
      agent_reasoning: "User wants to trade",
      proposed_action: {
        type: "trade",
        asset: "AAPL",
        amount: 100,
        side: "buy"
      }
    },
    ['request_id', 'decision', 'final_status']
  );
  test1 ? passed++ : failed++;
  
  // Test 2: Blocked trade
  const test2 = await testCLI(
    'Blocked Trade (Analysis)',
    {
      user_input: "Analyze NVDA",
      agent_reasoning: "User wants analysis",
      proposed_action: {
        type: "trade",
        asset: "NVDA",
        amount: 100
      }
    },
    ['request_id', 'decision', 'final_status']
  );
  test2 ? passed++ : failed++;
  
  // Test 3: Invalid input
  const test3 = await testCLI(
    'Invalid Input (Missing Fields)',
    {
      user_input: "Buy AAPL"
      // Missing proposed_action
    },
    ['status', 'error']
  );
  test3 ? passed++ : failed++;
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
