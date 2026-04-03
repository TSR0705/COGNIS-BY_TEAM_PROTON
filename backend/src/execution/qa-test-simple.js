const { executeTrade } = require('./executeTrade');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         EXECUTION LAYER - QA TEST SUITE                   ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

let passCount = 0;
let failCount = 0;
const failures = [];

function test(testNum, testName, testFn) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`TEST ${testNum}: ${testName}`);
  console.log(`${'═'.repeat(60)}\n`);
  
  return testFn()
    .then(result => {
      if (result.passed) {
        console.log('✅ PASS - All checks passed\n');
        passCount++;
      } else {
        console.log('❌ FAIL - Some checks failed\n');
        failCount++;
        failures.push({ test: testNum, name: testName, issues: result.issues });
      }
    })
    .catch(error => {
      console.log('❌ FAIL - Test crashed: ' + error.message + '\n');
      failCount++;
      failures.push({ test: testNum, name: testName, error: error.message });
    });
}

// TEST 1: BLOCKED FLOW
async function test1() {
  return test(1, 'BLOCKED FLOW - Enforcement Denies', async () => {
    console.log('Input: decision = BLOCK');
    
    const request = {
      request_id: 'qa-exec-001',
      timestamp: '2026-04-03T16:00:00Z',
      action: {
        type: 'trade',
        asset: 'AAPL',
        amount: 10
      }
    };
    
    const enforcementResult = {
      decision: 'BLOCK',
      matched_rule: 'DENY_TRADE_IF_NOT_ALLOWED',
      reason: 'Block trade if intent does not permit it'
    };
    
    const result = await executeTrade(request, enforcementResult);
    const issues = [];
    
    console.log(`Status: ${result.status}`);
    console.log(`Message: ${result.message}`);
    
    // Check status = "blocked"
    if (result.status === 'blocked') {
      console.log('✅ status = "blocked"');
    } else {
      console.log(`❌ status = "${result.status}" (expected: "blocked")`);
      issues.push('Status should be "blocked"');
    }
    
    // Check message
    if (result.message === 'Execution skipped due to enforcement') {
      console.log('✅ message = "Execution skipped due to enforcement"');
    } else {
      console.log(`❌ message incorrect`);
      issues.push('Message should indicate execution skipped');
    }
    
    // Check no order_id (since blocked)
    if (!result.order_id) {
      console.log('✅ No order_id (execution skipped)');
    } else {
      console.log('❌ order_id should not be present');
      issues.push('order_id should not be present when blocked');
    }
    
    return { passed: issues.length === 0, issues };
  });
}

// TEST 2: INVALID ACTION - Missing Asset
async function test2() {
  return test(2, 'INVALID ACTION - Missing Asset', async () => {
    console.log('Input: action missing asset field');
    
    const request = {
      request_id: 'qa-exec-002',
      timestamp: '2026-04-03T16:05:00Z',
      action: {
        type: 'trade',
        // missing asset
        amount: 10
      }
    };
    
    const enforcementResult = {
      decision: 'ALLOW'
    };
    
    const result = await executeTrade(request, enforcementResult);
    const issues = [];
    
    console.log(`Status: ${result.status}`);
    console.log(`Error: ${result.error}`);
    
    // Check status = "failed"
    if (result.status === 'failed') {
      console.log('✅ status = "failed"');
    } else {
      console.log(`❌ status = "${result.status}" (expected: "failed")`);
      issues.push('Status should be "failed"');
    }
    
    // Check error message
    if (result.error && result.error.includes('missing asset')) {
      console.log('✅ error mentions "missing asset"');
    } else {
      console.log(`❌ error = "${result.error}"`);
      issues.push('Error should mention missing asset');
    }
    
    return { passed: issues.length === 0, issues };
  });
}

// TEST 3: INVALID ACTION - Wrong Type
async function test3() {
  return test(3, 'INVALID ACTION - Wrong Type', async () => {
    console.log('Input: action.type = "withdraw" (not "trade")');
    
    const request = {
      request_id: 'qa-exec-003',
      timestamp: '2026-04-03T16:10:00Z',
      action: {
        type: 'withdraw',  // WRONG TYPE
        asset: 'AAPL',
        amount: 10
      }
    };
    
    const enforcementResult = {
      decision: 'ALLOW'
    };
    
    const result = await executeTrade(request, enforcementResult);
    const issues = [];
    
    console.log(`Status: ${result.status}`);
    console.log(`Error: ${result.error}`);
    
    // Check status = "failed"
    if (result.status === 'failed') {
      console.log('✅ status = "failed"');
    } else {
      console.log(`❌ status = "${result.status}" (expected: "failed")`);
      issues.push('Status should be "failed"');
    }
    
    // Check error message
    if (result.error && result.error.includes('type must be "trade"')) {
      console.log('✅ error mentions type must be "trade"');
    } else {
      console.log(`❌ error = "${result.error}"`);
      issues.push('Error should mention type requirement');
    }
    
    return { passed: issues.length === 0, issues };
  });
}

// TEST 4: INVALID ACTION - Amount Not Number
async function test4() {
  return test(4, 'INVALID ACTION - Amount Not Number', async () => {
    console.log('Input: action.amount = "10" (string, not number)');
    
    const request = {
      request_id: 'qa-exec-004',
      timestamp: '2026-04-03T16:15:00Z',
      action: {
        type: 'trade',
        asset: 'AAPL',
        amount: '10'  // STRING, not number
      }
    };
    
    const enforcementResult = {
      decision: 'ALLOW'
    };
    
    const result = await executeTrade(request, enforcementResult);
    const issues = [];
    
    console.log(`Status: ${result.status}`);
    console.log(`Error: ${result.error}`);
    
    // Check status = "failed"
    if (result.status === 'failed') {
      console.log('✅ status = "failed"');
    } else {
      console.log(`❌ status = "${result.status}" (expected: "failed")`);
      issues.push('Status should be "failed"');
    }
    
    // Check error message
    if (result.error && result.error.includes('amount must be a number')) {
      console.log('✅ error mentions amount must be a number');
    } else {
      console.log(`❌ error = "${result.error}"`);
      issues.push('Error should mention amount type requirement');
    }
    
    return { passed: issues.length === 0, issues };
  });
}

// TEST 5: MISSING CREDENTIALS
async function test5() {
  return test(5, 'MISSING CREDENTIALS - API Keys Not Set', async () => {
    console.log('Input: Valid trade but no API credentials');
    
    // Clear environment variables
    const originalKey = process.env.ALPACA_API_KEY;
    const originalSecret = process.env.ALPACA_API_SECRET;
    delete process.env.ALPACA_API_KEY;
    delete process.env.ALPACA_API_SECRET;
    
    const request = {
      request_id: 'qa-exec-005',
      timestamp: '2026-04-03T16:20:00Z',
      action: {
        type: 'trade',
        asset: 'AAPL',
        amount: 10
      }
    };
    
    const enforcementResult = {
      decision: 'ALLOW'
    };
    
    const result = await executeTrade(request, enforcementResult);
    const issues = [];
    
    console.log(`Status: ${result.status}`);
    console.log(`Error: ${result.error}`);
    
    // Check status = "failed"
    if (result.status === 'failed') {
      console.log('✅ status = "failed"');
    } else {
      console.log(`❌ status = "${result.status}" (expected: "failed")`);
      issues.push('Status should be "failed"');
    }
    
    // Check error message
    if (result.error && result.error.includes('credentials not configured')) {
      console.log('✅ error mentions credentials not configured');
    } else {
      console.log(`❌ error = "${result.error}"`);
      issues.push('Error should mention missing credentials');
    }
    
    // Restore environment variables
    if (originalKey) process.env.ALPACA_API_KEY = originalKey;
    if (originalSecret) process.env.ALPACA_API_SECRET = originalSecret;
    
    return { passed: issues.length === 0, issues };
  });
}

// Run all tests
async function runTests() {
  await test1();
  await test2();
  await test3();
  await test4();
  await test5();
  
  // Summary
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTotal Tests: ${passCount + failCount}`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%\n`);
  
  if (failures.length > 0) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    FAILURE DETAILS                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    failures.forEach(failure => {
      console.log(`TEST ${failure.test}: ${failure.name}`);
      if (failure.error) {
        console.log(`  Error: ${failure.error}`);
      } else if (failure.issues) {
        failure.issues.forEach(issue => {
          console.log(`  - ${issue}`);
        });
      }
      console.log();
    });
  }
  
  if (failCount === 0) {
    console.log('🎉 ALL TESTS PASSED! Execution layer validated.\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED. Review failures above.\n');
    process.exit(1);
  }
}

runTests();
