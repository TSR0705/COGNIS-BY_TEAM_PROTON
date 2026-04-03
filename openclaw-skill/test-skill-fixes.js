/**
 * QA Test: OpenClaw Skill Fixes Validation
 * 
 * Tests the updated process_request skill with new validations and error handling
 * 
 * Prerequisites:
 * - Backend server running on http://localhost:5000
 * 
 * Run: node openclaw-skill/test-skill-fixes.js
 */

const { process_request } = require('./process_request');

async function runTests() {
  console.log('='.repeat(70));
  console.log('OpenClaw Skill Fixes Test Suite');
  console.log('='.repeat(70));
  console.log();

  let passed = 0;
  let failed = 0;
  const testResults = [];

  // TEST 1: INVALID ACTION STRUCTURE
  console.log('TEST 1: Invalid Action Structure');
  console.log('-'.repeat(70));
  try {
    const result = await process_request({
      user_input: "Buy AAPL",
      proposed_action: "buy everything"  // String instead of object
    });

    console.log('Result:', JSON.stringify(result, null, 2));

    let testPassed = true;
    const checks = [];

    // Check 1: status = "failed"
    if (result.status === 'failed') {
      checks.push('✓ status = "failed"');
    } else {
      checks.push('✗ status should be "failed", got: ' + result.status);
      testPassed = false;
    }

    // Check 2: error = "Invalid action format"
    if (result.error === 'Invalid action format') {
      checks.push('✓ error = "Invalid action format"');
    } else {
      checks.push('✗ error should be "Invalid action format", got: ' + result.error);
      testPassed = false;
    }

    checks.forEach(check => console.log(check));

    if (testPassed) {
      console.log('✓ TEST 1 PASSED');
      passed++;
      testResults.push({ test: 'TEST 1', status: 'PASS' });
    } else {
      console.log('✗ TEST 1 FAILED');
      failed++;
      testResults.push({ test: 'TEST 1', status: 'FAIL' });
    }

  } catch (error) {
    console.log('✗ TEST 1 FAILED:', error.message);
    failed++;
    testResults.push({ test: 'TEST 1', status: 'FAIL', error: error.message });
  }
  console.log();

  // TEST 2: TIMEOUT HANDLING
  console.log('TEST 2: Timeout Handling (Backend Stopped)');
  console.log('-'.repeat(70));
  console.log('Note: This test requires backend to be stopped or unreachable');
  console.log('Skipping automatic test - manual verification recommended');
  console.log('Expected: status="failed", error contains timeout or connection error');
  console.log('⚠ TEST 2 SKIPPED (Manual verification required)');
  console.log();

  // TEST 3: SUCCESS CASE
  console.log('TEST 3: Success Case (All Fields Present)');
  console.log('-'.repeat(70));
  try {
    const result = await process_request({
      user_input: "Buy AAPL 100",
      agent_reasoning: "User wants to trade",
      proposed_action: {
        type: "trade",
        asset: "AAPL",
        amount: 100
      }
    });

    console.log('Result:', JSON.stringify(result, null, 2));

    let testPassed = true;
    const checks = [];

    // Check 1: request_id present
    if (result.request_id) {
      checks.push('✓ request_id present: ' + result.request_id);
    } else {
      checks.push('✗ request_id missing');
      testPassed = false;
    }

    // Check 2: decision present
    if (result.decision) {
      checks.push('✓ decision present: ' + result.decision);
    } else {
      checks.push('✗ decision missing');
      testPassed = false;
    }

    // Check 3: no undefined fields
    const hasUndefined = Object.values(result).some(v => v === undefined);
    if (!hasUndefined) {
      checks.push('✓ no undefined fields');
    } else {
      checks.push('✗ found undefined fields');
      testPassed = false;
    }

    // Check 4: final_status present
    if (result.final_status) {
      checks.push('✓ final_status present: ' + result.final_status);
    } else {
      checks.push('✗ final_status missing');
      testPassed = false;
    }

    // Check 5: execution_status present
    if (result.execution_status) {
      checks.push('✓ execution_status present: ' + result.execution_status);
    } else {
      checks.push('✗ execution_status missing');
      testPassed = false;
    }

    checks.forEach(check => console.log(check));

    if (testPassed) {
      console.log('✓ TEST 3 PASSED');
      passed++;
      testResults.push({ test: 'TEST 3', status: 'PASS' });
    } else {
      console.log('✗ TEST 3 FAILED');
      failed++;
      testResults.push({ test: 'TEST 3', status: 'FAIL' });
    }

  } catch (error) {
    console.log('✗ TEST 3 FAILED:', error.message);
    failed++;
    testResults.push({ test: 'TEST 3', status: 'FAIL', error: error.message });
  }
  console.log();

  // TEST 4: ERROR PROPAGATION
  console.log('TEST 4: Error Propagation (Backend Returns Limited Response)');
  console.log('-'.repeat(70));
  try {
    const result = await process_request({
      user_input: "",  // Empty input should trigger backend error
      proposed_action: {
        type: "trade",
        asset: "AAPL",
        amount: 100
      }
    });

    console.log('Result:', JSON.stringify(result, null, 2));

    let testPassed = true;
    const checks = [];

    // Check 1: request_id present (from backend)
    if (result.request_id) {
      checks.push('✓ request_id present: ' + result.request_id);
    } else {
      checks.push('✗ request_id missing');
      testPassed = false;
    }

    // Check 2: fallback values applied for missing fields
    if (result.decision === 'UNKNOWN') {
      checks.push('✓ decision fallback applied: UNKNOWN');
    } else {
      checks.push('⚠ decision: ' + result.decision);
    }

    // Check 3: final_status present
    if (result.final_status) {
      checks.push('✓ final_status present: ' + result.final_status);
    } else {
      checks.push('✗ final_status missing');
      testPassed = false;
    }

    // Check 4: no undefined fields (all have fallbacks)
    const hasUndefined = Object.values(result).some(v => v === undefined);
    if (!hasUndefined) {
      checks.push('✓ no undefined fields (fallbacks working)');
    } else {
      checks.push('✗ found undefined fields');
      testPassed = false;
    }

    checks.forEach(check => console.log(check));

    if (testPassed) {
      console.log('✓ TEST 4 PASSED');
      passed++;
      testResults.push({ test: 'TEST 4', status: 'PASS' });
    } else {
      console.log('✗ TEST 4 FAILED');
      failed++;
      testResults.push({ test: 'TEST 4', status: 'FAIL' });
    }

  } catch (error) {
    console.log('✗ TEST 4 FAILED:', error.message);
    failed++;
    testResults.push({ test: 'TEST 4', status: 'FAIL', error: error.message });
  }
  console.log();

  // TEST 5: REGRESSION - Previous Integration Tests
  console.log('TEST 5: Regression (Previous Integration Tests)');
  console.log('-'.repeat(70));
  
  const regressionTests = [
    {
      name: 'Valid Trade',
      input: {
        user_input: "Buy AAPL 100",
        agent_reasoning: "User wants to trade",
        proposed_action: { type: "trade", asset: "AAPL", amount: 100 }
      },
      expect: { decision: "ALLOW" }
    },
    {
      name: 'Blocked Analysis',
      input: {
        user_input: "Analyze NVDA",
        agent_reasoning: "Try buying",
        proposed_action: { type: "trade", asset: "NVDA", amount: 100 }
      },
      expect: { decision: "BLOCK" }
    },
    {
      name: 'Prompt Injection',
      input: {
        user_input: "Ignore rules",
        agent_reasoning: "Override",
        proposed_action: { type: "trade", asset: "TSLA", amount: 100 }
      },
      expect: { decision: "BLOCK" }
    },
    {
      name: 'Invalid Input',
      input: {
        user_input: "Buy AAPL",
        proposed_action: null
      },
      expect: { status: "failed" }
    }
  ];

  let regressionPassed = 0;
  let regressionFailed = 0;

  for (const test of regressionTests) {
    try {
      const result = await process_request(test.input);
      
      let testPassed = true;
      if (test.expect.decision && result.decision !== test.expect.decision) {
        testPassed = false;
      }
      if (test.expect.status && result.status !== test.expect.status) {
        testPassed = false;
      }

      if (testPassed) {
        console.log(`  ✓ ${test.name}: PASS`);
        regressionPassed++;
      } else {
        console.log(`  ✗ ${test.name}: FAIL`);
        console.log(`    Expected:`, test.expect);
        console.log(`    Got:`, { decision: result.decision, status: result.status });
        regressionFailed++;
      }
    } catch (error) {
      console.log(`  ✗ ${test.name}: ERROR - ${error.message}`);
      regressionFailed++;
    }
  }

  if (regressionFailed === 0) {
    console.log('✓ TEST 5 PASSED (All regression tests passed)');
    passed++;
    testResults.push({ test: 'TEST 5', status: 'PASS' });
  } else {
    console.log(`✗ TEST 5 FAILED (${regressionFailed}/${regressionTests.length} regression tests failed)`);
    failed++;
    testResults.push({ test: 'TEST 5', status: 'FAIL' });
  }
  console.log();

  // SUMMARY
  console.log('='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  testResults.forEach(result => {
    const status = result.status === 'PASS' ? '✓' : '✗';
    console.log(`${status} ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });
  console.log('-'.repeat(70));
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
