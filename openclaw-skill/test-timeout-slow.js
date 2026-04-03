/**
 * Timeout Test with Slow Backend
 * 
 * Prerequisites:
 * - Slow backend running on port 5001 (node backend/test-slow-endpoint.js)
 * 
 * Run: node openclaw-skill/test-timeout-slow.js
 */

const axios = require('axios');

async function testTimeoutWithSlowBackend() {
  console.log('='.repeat(70));
  console.log('OpenClaw Skill Timeout Test (Slow Backend)');
  console.log('='.repeat(70));
  console.log();
  console.log('Testing with backend that delays 5 seconds');
  console.log('Expected: Request should timeout after 3 seconds');
  console.log();

  const startTime = Date.now();

  try {
    console.log('Calling slow backend (5 second delay)...');
    
    // Simulate the skill's request with 3-second timeout
    const response = await axios.post(
      'http://localhost:5001/api/process',
      {
        input: "Buy AAPL 100",
        action: { type: "trade", asset: "AAPL", amount: 100 },
        source: "openclaw",
        agent: {
          reasoning: "Testing timeout",
          proposed_action: { type: "trade", asset: "AAPL", amount: 100 }
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 3000,
        validateStatus: () => true
      }
    );

    const elapsed = Date.now() - startTime;

    console.log();
    console.log('❌ UNEXPECTED: Request completed without timeout');
    console.log('Result:', JSON.stringify(response.data, null, 2));
    console.log(`Time elapsed: ${elapsed}ms`);
    console.log();
    console.log('❌ TIMEOUT TEST FAILED');
    console.log('The request should have timed out after 3 seconds');
    process.exit(1);

  } catch (error) {
    const elapsed = Date.now() - startTime;

    console.log();
    console.log('Request failed (as expected)');
    console.log(`Time elapsed: ${elapsed}ms`);
    console.log('Error:', error.message);
    console.log();

    // Validate result
    let passed = true;
    const checks = [];

    // Check 1: timeout occurred (should be around 3000ms)
    if (elapsed >= 2900 && elapsed <= 3500) {
      checks.push(`✓ timeout occurred at ~3000ms (actual: ${elapsed}ms)`);
    } else {
      checks.push(`✗ timeout should be ~3000ms, got ${elapsed}ms`);
      passed = false;
    }

    // Check 2: error code is timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      checks.push('✓ error indicates timeout: ' + error.code);
    } else {
      checks.push('⚠ error code: ' + error.code);
    }

    // Check 3: error message mentions timeout
    if (error.message.toLowerCase().includes('timeout')) {
      checks.push('✓ error message mentions timeout');
    } else {
      checks.push('⚠ error message: ' + error.message);
    }

    console.log('-'.repeat(70));
    checks.forEach(check => console.log(check));
    console.log('-'.repeat(70));

    if (passed) {
      console.log();
      console.log('✅ TIMEOUT TEST PASSED');
      console.log();
      console.log('Summary:');
      console.log('- Request timed out after 3 seconds as expected');
      console.log('- Backend was still processing (5 second delay)');
      console.log('- Timeout protection working correctly');
      console.log();
      console.log('Skill behavior:');
      console.log('- Would return: { status: "failed", error: "timeout of 3000ms exceeded" }');
      process.exit(0);
    } else {
      console.log();
      console.log('❌ TIMEOUT TEST FAILED');
      process.exit(1);
    }
  }
}

// Run test
testTimeoutWithSlowBackend();
