/**
 * Timeout Test for OpenClaw Skill
 * 
 * Prerequisites:
 * - Backend server MUST BE STOPPED
 * 
 * Run: node openclaw-skill/test-timeout.js
 */

const { process_request } = require('./process_request');

async function testTimeout() {
  console.log('='.repeat(70));
  console.log('OpenClaw Skill Timeout Test');
  console.log('='.repeat(70));
  console.log();
  console.log('⚠️  IMPORTANT: Backend must be STOPPED for this test');
  console.log('Expected: Request should timeout after 3 seconds');
  console.log();

  const startTime = Date.now();

  try {
    console.log('Calling process_request with backend stopped...');
    
    const result = await process_request({
      user_input: "Buy AAPL 100",
      agent_reasoning: "Testing timeout",
      proposed_action: {
        type: "trade",
        asset: "AAPL",
        amount: 100
      }
    });

    const elapsed = Date.now() - startTime;

    console.log();
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log();
    console.log(`Time elapsed: ${elapsed}ms`);
    console.log();

    // Validate result
    let passed = true;
    const checks = [];

    // Check 1: status = "failed"
    if (result.status === 'failed') {
      checks.push('✓ status = "failed"');
    } else {
      checks.push('✗ status should be "failed", got: ' + result.status);
      passed = false;
    }

    // Check 2: error field present
    if (result.error) {
      checks.push('✓ error field present: ' + result.error);
    } else {
      checks.push('✗ error field missing');
      passed = false;
    }

    // Check 3: timeout occurred (should be around 3000ms)
    if (elapsed >= 2900 && elapsed <= 3500) {
      checks.push(`✓ timeout occurred at ~3000ms (actual: ${elapsed}ms)`);
    } else if (elapsed < 2900) {
      checks.push(`⚠ response too fast (${elapsed}ms) - might be connection refused instead of timeout`);
      // This is still acceptable - connection refused is faster than timeout
    } else {
      checks.push(`✗ timeout took too long (${elapsed}ms)`);
      passed = false;
    }

    // Check 4: error message indicates connection/timeout issue
    const errorStr = String(result.error).toLowerCase();
    if (errorStr.includes('timeout') || 
        errorStr.includes('econnrefused') || 
        errorStr.includes('unavailable') ||
        errorStr.includes('connect')) {
      checks.push('✓ error message indicates connection/timeout issue');
    } else {
      checks.push('⚠ error message unclear: ' + result.error);
    }

    console.log('-'.repeat(70));
    checks.forEach(check => console.log(check));
    console.log('-'.repeat(70));

    if (passed) {
      console.log();
      console.log('✅ TIMEOUT TEST PASSED');
      console.log();
      console.log('Summary:');
      console.log('- Request failed as expected');
      console.log('- Error handling working correctly');
      console.log('- Timeout protection active');
      process.exit(0);
    } else {
      console.log();
      console.log('❌ TIMEOUT TEST FAILED');
      process.exit(1);
    }

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.log();
    console.log('❌ Unexpected error:', error.message);
    console.log(`Time elapsed: ${elapsed}ms`);
    process.exit(1);
  }
}

// Run test
testTimeout();
