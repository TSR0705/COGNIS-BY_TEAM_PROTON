// Manual mock for axios
const originalAxios = require('axios');
let mockAxios = {
  post: null
};

// Replace axios.post with our mock
require.cache[require.resolve('axios')].exports = mockAxios;

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
      console.log(`❌ FAIL - Test crashed: ${error.message}\n`);
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
    
    // Track if axios was called
    let apiCalled = false;
    axios.post.mockImplementation(() => {
      apiCalled = true;
      return Promise.resolve({ data: { id: 'should-not-happen' } });
    });
    
    const result = await executeTrade(request, enforcementResult);
    const issues = [];
    
    console.log(`Status: ${result.status}`);
    console.log(`Message: ${result.message}`);
    console.log(`API Called: ${apiCalled}`);
    
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
    
    // Check no API call
    if (!apiCalled) {
      console.log('✅ No API call made');
    } else {
      console.log('❌ API call was made (should not happen)');
      issues.push('API should not be called when blocked');
    }
    
    return { passed: issues.length === 0, issues };
  });
}

// TEST 2: INVALID ACTION
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
    
    // Track if axios was called
    let apiCalled = false;
    axios.post.mockImplementation(() => {
      apiCalled = true;
      return Promise.resolve({ data: { id: 'should-not-happen' } });
    });
    
    const result = await executeTrade(request, enforcementResult);
    const issues = [];
    
    console.log(`Status: ${result.status}`);
    console.log(`Error: ${result.error}`);
    console.log(`API Called: ${apiCalled}`);
    
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
    
    // Check no API call
    if (!apiCalled) {
      console.log('✅ No API call made');
    } else {
      console.log('❌ API call was made (should not happen)');
      issues.push('API should not be called for invalid action');
    }
    
    return { passed: issues.length === 0, issues };
  });
}

// TEST 3: VALID TRADE
async function test3() {
  return test(3, 'VALID TRADE - Mock API Success', async () => {
    console.log('Input: Valid trade with mocked API success');
    
    const request = {
      request_id: 'qa-exec-003',
      timestamp: '2026-04-03T16:10:00Z',
      action: {
        type: 'trade',
        asset: 'AAPL',
        amount: 10
      }
    };
    
    const enforcementResult = {
      decision: 'ALLOW'
    };
    
    // Mock successful API response
    const mockOrderId = 'mock-order-123';
    let capturedPayload = null;
    
    axios.post.mockImplementation((url, payload, config) => {
      capturedPayload = payload;
      return Promise.resolve({
        data: {
          id: mockOrderId,
          client_order_id: payload.client_order_id,
          symbol: payload.symbol,
          qty: payload.qty,
          side: payload.side,
          type: payload.type,
          status: 'accepted'
        }
      });
    });
    
    // Set mock environment variables
    process.env.ALPACA_API_KEY = 'mock-key';
    process.env.ALPACA_API_SECRET = 'mock-secret';
    
    const result = await executeTrade(request, enforcementResult);
    const issues = [];
    
    console.log(`Status: ${result.status}`);
    console.log(`Order ID: ${result.order_id}`);
    console.log(`Asset: ${result.asset}`);
    console.log(`Amount: ${result.amount}`);
    
    // Check status = "success"
    if (result.status === 'success') {
      console.log('✅ status = "success"');
    } else {
      console.log(`❌ status = "${result.status}" (expected: "success")`);
      issues.push('Status should be "success"');
    }
    
    // Check order_id present
    if (result.order_id === mockOrderId) {
      console.log('✅ order_id present and correct');
    } else {
      console.log(`❌ order_id = "${result.order_id}" (expected: "${mockOrderId}")`);
      issues.push('order_id should match mock response');
    }
    
    // Check asset
    if (result.asset === 'AAPL') {
      console.log('✅ asset = "AAPL"');
    } else {
      console.log(`❌ asset = "${result.asset}"`);
      issues.push('Asset should be AAPL');
    }
    
    // Check amount
    if (result.amount === 10) {
      console.log('✅ amount = 10');
    } else {
      console.log(`❌ amount = ${result.amount}`);
      issues.push('Amount should be 10');
    }
    
    // Check request_id
    if (result.request_id === 'qa-exec-003') {
      console.log('✅ request_id preserved');
    } else {
      console.log(`❌ request_id not preserved`);
      issues.push('request_id should be preserved');
    }
    
    return { passed: issues.length === 0, issues };
  });
}

// TEST 4: API FAILURE
async function test4() {
  return test(4, 'API FAILURE - Simulate API Error', async () => {
    console.log('Input: Valid trade but API returns error');
    
    const request = {
      request_id: 'qa-exec-004',
      timestamp: '2026-04-03T16:15:00Z',
      action: {
        type: 'trade',
        asset: 'INVALID',
        amount: 10
      }
    };
    
    const enforcementResult = {
      decision: 'ALLOW'
    };
    
    // Mock API error
    axios.post.mockImplementation(() => {
      return Promise.reject(new Error('symbol INVALID is not found'));
    });
    
    // Set mock environment variables
    process.env.ALPACA_API_KEY = 'mock-key';
    process.env.ALPACA_API_SECRET = 'mock-secret';
    
    const result = await executeTrade(request, enforcementResult);
    const issues = [];
    
    console.log(`Status: ${result.status}`);
    console.log(`Error: ${result.error}`);
    console.log(`Details: ${result.details}`);
    
    // Check status = "failed"
    if (result.status === 'failed') {
      console.log('✅ status = "failed"');
    } else {
      console.log(`❌ status = "${result.status}" (expected: "failed")`);
      issues.push('Status should be "failed"');
    }
    
    // Check error message present
    if (result.error === 'Alpaca API error') {
      console.log('✅ error = "Alpaca API error"');
    } else {
      console.log(`❌ error = "${result.error}"`);
      issues.push('Error should be "Alpaca API error"');
    }
    
    // Check details present
    if (result.details && result.details.includes('INVALID')) {
      console.log('✅ details present with error information');
    } else {
      console.log(`❌ details missing or incorrect`);
      issues.push('Details should contain error information');
    }
    
    return { passed: issues.length === 0, issues };
  });
}

// TEST 5: CLIENT ORDER ID
async function test5() {
  return test(5, 'CLIENT ORDER ID - Matches request_id', async () => {
    console.log('Input: Valid trade, check client_order_id');
    
    const request = {
      request_id: 'qa-exec-005-unique-id',
      timestamp: '2026-04-03T16:20:00Z',
      action: {
        type: 'trade',
        asset: 'TSLA',
        amount: 5
      }
    };
    
    const enforcementResult = {
      decision: 'ALLOW'
    };
    
    // Mock API and capture payload
    let capturedPayload = null;
    
    axios.post.mockImplementation((url, payload, config) => {
      capturedPayload = payload;
      return Promise.resolve({
        data: {
          id: 'order-456',
          client_order_id: payload.client_order_id,
          symbol: payload.symbol,
          qty: payload.qty
        }
      });
    });
    
    // Set mock environment variables
    process.env.ALPACA_API_KEY = 'mock-key';
    process.env.ALPACA_API_SECRET = 'mock-secret';
    
    const result = await executeTrade(request, enforcementResult);
    const issues = [];
    
    console.log(`request_id: ${request.request_id}`);
    console.log(`client_order_id in payload: ${capturedPayload?.client_order_id}`);
    
    // Check client_order_id matches request_id
    if (capturedPayload && capturedPayload.client_order_id === request.request_id) {
      console.log('✅ client_order_id == request_id');
    } else {
      console.log(`❌ client_order_id mismatch`);
      issues.push('client_order_id should match request_id');
    }
    
    // Check payload structure
    if (capturedPayload) {
      console.log('\nPayload structure:');
      
      if (capturedPayload.symbol === 'TSLA') {
        console.log('  ✅ symbol = "TSLA"');
      } else {
        console.log(`  ❌ symbol = "${capturedPayload.symbol}"`);
        issues.push('Symbol should be TSLA');
      }
      
      if (capturedPayload.qty === 5) {
        console.log('  ✅ qty = 5');
      } else {
        console.log(`  ❌ qty = ${capturedPayload.qty}`);
        issues.push('Quantity should be 5');
      }
      
      if (capturedPayload.side === 'buy') {
        console.log('  ✅ side = "buy"');
      } else {
        console.log(`  ❌ side = "${capturedPayload.side}"`);
        issues.push('Side should be "buy"');
      }
      
      if (capturedPayload.type === 'market') {
        console.log('  ✅ type = "market"');
      } else {
        console.log(`  ❌ type = "${capturedPayload.type}"`);
        issues.push('Type should be "market"');
      }
      
      if (capturedPayload.time_in_force === 'day') {
        console.log('  ✅ time_in_force = "day"');
      } else {
        console.log(`  ❌ time_in_force = "${capturedPayload.time_in_force}"`);
        issues.push('time_in_force should be "day"');
      }
    } else {
      console.log('❌ Payload not captured');
      issues.push('Payload should be captured');
    }
    
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
    console.log('🎉 ALL TESTS PASSED! Execution layer is production-ready.\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED. Review failures above.\n');
    process.exit(1);
  }
}

runTests();
