const mongoose = require('mongoose');
const { saveLog } = require('./saveLog');
const Log = require('../models/Log');

/**
 * QA Test Suite for Logging System
 */

// Mock console.error to capture fail-safe behavior
let consoleErrors = [];
const originalConsoleError = console.error;
console.error = (...args) => {
  consoleErrors.push(args.join(' '));
  originalConsoleError(...args);
};

async function runTests() {
  console.log('='.repeat(60));
  console.log('LOGGING SYSTEM - QA TEST SUITE');
  console.log('='.repeat(60));
  console.log();

  let passCount = 0;
  let failCount = 0;

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cognis_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB\n');

    // Clear test data
    await Log.deleteMany({});

    // TEST 1: SUCCESS FLOW
    console.log('TEST 1: SUCCESS FLOW');
    console.log('-'.repeat(60));
    try {
      const successData = {
        request_id: 'test-success-001',
        timestamp: '2026-04-03T18:00:00Z',
        input: { raw_input: 'buy 10 shares of AAPL' },
        intent: {
          intent_id: 'intent-001',
          intent_type: 'trade',
          status: 'valid'
        },
        policy: {
          policy_id: 'policy-001',
          rules: [1, 2, 3, 4]
        },
        action: {
          type: 'trade',
          asset: 'AAPL',
          amount: 10
        },
        enforcement: {
          decision: 'ALLOW',
          matched_rule: 'ALLOW_TRADE_WITH_LIMIT',
          reason: 'Trade allowed',
          trace: []
        },
        execution: {
          status: 'success',
          order_id: 'order-123'
        },
        timing: { total_ms: 245 }
      };

      await saveLog(successData);

      // Verify in database
      const savedLog = await Log.findOne({ request_id: 'test-success-001' });
      
      if (!savedLog) {
        throw new Error('Log not saved to database');
      }

      if (savedLog.final_status !== 'allowed') {
        throw new Error(`Expected final_status "allowed", got "${savedLog.final_status}"`);
      }

      if (savedLog.severity !== 'INFO') {
        throw new Error(`Expected severity "INFO", got "${savedLog.severity}"`);
      }

      console.log('✓ final_status = "allowed"');
      console.log('✓ severity = "INFO"');
      console.log('✓ Log saved to database');
      console.log('RESULT: PASS\n');
      passCount++;
    } catch (error) {
      console.log('✗ RESULT: FAIL');
      console.log(`  Error: ${error.message}\n`);
      failCount++;
    }

    // TEST 2: BLOCKED FLOW
    console.log('TEST 2: BLOCKED FLOW');
    console.log('-'.repeat(60));
    try {
      const blockedData = {
        request_id: 'test-blocked-002',
        timestamp: '2026-04-03T18:05:00Z',
        input: { raw_input: 'analyze TSLA stock' },
        intent: {
          intent_id: 'intent-002',
          intent_type: 'analysis',
          status: 'valid'
        },
        policy: {
          policy_id: 'policy-002',
          rules: [1, 2, 3]
        },
        action: {
          type: 'trade',
          asset: 'TSLA',
          amount: 5
        },
        enforcement: {
          decision: 'BLOCK',
          matched_rule: 'DENY_TRADE_IF_NOT_ALLOWED',
          reason: 'Trade not allowed',
          trace: []
        },
        execution: {
          status: 'blocked'
        },
        timing: { total_ms: 123 }
      };

      await saveLog(blockedData);

      // Verify in database
      const savedLog = await Log.findOne({ request_id: 'test-blocked-002' });
      
      if (!savedLog) {
        throw new Error('Log not saved to database');
      }

      if (savedLog.final_status !== 'blocked') {
        throw new Error(`Expected final_status "blocked", got "${savedLog.final_status}"`);
      }

      if (savedLog.severity !== 'WARN') {
        throw new Error(`Expected severity "WARN", got "${savedLog.severity}"`);
      }

      console.log('✓ final_status = "blocked"');
      console.log('✓ severity = "WARN"');
      console.log('✓ Log saved to database');
      console.log('RESULT: PASS\n');
      passCount++;
    } catch (error) {
      console.log('✗ RESULT: FAIL');
      console.log(`  Error: ${error.message}\n`);
      failCount++;
    }

    // TEST 3: FAILED EXECUTION
    console.log('TEST 3: FAILED EXECUTION');
    console.log('-'.repeat(60));
    try {
      const failedData = {
        request_id: 'test-failed-003',
        timestamp: '2026-04-03T18:10:00Z',
        input: { raw_input: 'buy 100 shares of INVALID' },
        intent: {
          intent_id: 'intent-003',
          intent_type: 'trade',
          status: 'valid'
        },
        policy: {
          policy_id: 'policy-003',
          rules: [1, 2, 3, 4]
        },
        action: {
          type: 'trade',
          asset: 'INVALID',
          amount: 100
        },
        enforcement: {
          decision: 'ALLOW',
          matched_rule: 'ALLOW_TRADE_WITH_LIMIT',
          reason: 'Trade allowed',
          trace: []
        },
        execution: {
          status: 'failed',
          error_type: 'API_ERROR',
          error: 'symbol INVALID is not found'
        },
        timing: { total_ms: 567 }
      };

      await saveLog(failedData);

      // Verify in database
      const savedLog = await Log.findOne({ request_id: 'test-failed-003' });
      
      if (!savedLog) {
        throw new Error('Log not saved to database');
      }

      if (savedLog.final_status !== 'failed') {
        throw new Error(`Expected final_status "failed", got "${savedLog.final_status}"`);
      }

      if (savedLog.severity !== 'ERROR') {
        throw new Error(`Expected severity "ERROR", got "${savedLog.severity}"`);
      }

      console.log('✓ final_status = "failed"');
      console.log('✓ severity = "ERROR"');
      console.log('✓ Log saved to database');
      console.log('RESULT: PASS\n');
      passCount++;
    } catch (error) {
      console.log('✗ RESULT: FAIL');
      console.log(`  Error: ${error.message}\n`);
      failCount++;
    }

    // TEST 4: DATA INTEGRITY
    console.log('TEST 4: DATA INTEGRITY');
    console.log('-'.repeat(60));
    try {
      const integrityData = {
        request_id: 'test-integrity-004',
        timestamp: '2026-04-03T18:15:00Z',
        input: { raw_input: 'buy 5 shares of NVDA' },
        intent: {
          intent_id: 'intent-004',
          intent_type: 'trade',
          status: 'valid',
          scope: ['NVDA']
        },
        policy: {
          policy_id: 'policy-004',
          rules: [1, 2, 3, 4]
        },
        action: {
          type: 'trade',
          asset: 'NVDA',
          amount: 5
        },
        enforcement: {
          decision: 'ALLOW',
          matched_rule: 'ALLOW_TRADE_WITH_LIMIT',
          reason: 'Trade allowed',
          trace: [
            { rule_id: 'RULE_1', passed: true }
          ]
        },
        execution: {
          status: 'success',
          order_id: 'order-456'
        },
        timing: { total_ms: 189 }
      };

      await saveLog(integrityData);

      // Verify in database
      const savedLog = await Log.findOne({ request_id: 'test-integrity-004' });
      
      if (!savedLog) {
        throw new Error('Log not saved to database');
      }

      // Check request_id
      if (savedLog.request_id !== 'test-integrity-004') {
        throw new Error('request_id not stored correctly');
      }
      console.log('✓ request_id present');

      // Check intent
      if (!savedLog.intent || savedLog.intent.intent_id !== 'intent-004') {
        throw new Error('intent not stored correctly');
      }
      console.log('✓ intent stored');

      // Check enforcement
      if (!savedLog.enforcement || savedLog.enforcement.decision !== 'ALLOW') {
        throw new Error('enforcement not stored correctly');
      }
      console.log('✓ enforcement stored');

      // Check execution
      if (!savedLog.execution || savedLog.execution.order_id !== 'order-456') {
        throw new Error('execution not stored correctly');
      }
      console.log('✓ execution stored');

      // Check policy rules_count
      if (!savedLog.policy || savedLog.policy.rules_count !== 4) {
        throw new Error('policy rules_count not calculated correctly');
      }
      console.log('✓ policy rules_count calculated');

      console.log('RESULT: PASS\n');
      passCount++;
    } catch (error) {
      console.log('✗ RESULT: FAIL');
      console.log(`  Error: ${error.message}\n`);
      failCount++;
    }

    // TEST 5: FAIL SAFE
    console.log('TEST 5: FAIL SAFE');
    console.log('-'.repeat(60));
    try {
      // Clear console errors
      consoleErrors = [];

      // Disconnect from MongoDB to simulate DB error
      await mongoose.connection.close();
      console.log('✓ Disconnected from MongoDB (simulating error)');

      const failSafeData = {
        request_id: 'test-failsafe-005',
        timestamp: '2026-04-03T18:20:00Z',
        input: { raw_input: 'test' },
        execution: {
          status: 'success'
        }
      };

      // This should not throw
      await saveLog(failSafeData);
      console.log('✓ saveLog did not throw error');

      // Check if console.error was called
      if (consoleErrors.length === 0) {
        throw new Error('Expected console.error to be called');
      }
      console.log('✓ console.error printed');

      // Verify error message contains expected text
      const errorMessage = consoleErrors[0];
      if (!errorMessage.includes('Failed to save log to MongoDB')) {
        throw new Error('Error message does not match expected format');
      }
      console.log('✓ Error message format correct');

      console.log('RESULT: PASS\n');
      passCount++;
    } catch (error) {
      console.log('✗ RESULT: FAIL');
      console.log(`  Error: ${error.message}\n`);
      failCount++;
    }

    // SUMMARY
    console.log('='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${passCount + failCount}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (failCount === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Logging system validated.\n');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED. Review errors above.\n');
    }

  } catch (error) {
    console.error('Test suite error:', error);
  } finally {
    // Restore console.error
    console.error = originalConsoleError;
    
    // Close connection if still open
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(failCount > 0 ? 1 : 0);
  }
}

// Run tests
runTests();
