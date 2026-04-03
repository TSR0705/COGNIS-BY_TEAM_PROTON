const mongoose = require('mongoose');
const { saveLog } = require('./saveLog');
const Log = require('../models/Log');

/**
 * QA Test Suite for Logging System Fixes
 */

async function runTests() {
  console.log('='.repeat(60));
  console.log('LOGGING SYSTEM FIXES - QA TEST SUITE');
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

    // TEST 1: LONG INPUT TRIMMING
    console.log('TEST 1: LONG INPUT TRIMMING');
    console.log('-'.repeat(60));
    try {
      const longInput = 'a'.repeat(1500); // 1500 characters
      
      const longInputData = {
        request_id: 'test-long-input-001',
        timestamp: '2026-04-03T20:00:00Z',
        input: { raw_input: longInput },
        enforcement: {
          decision: 'ALLOW',
          matched_rule: 'ALLOW_TRADE_WITH_LIMIT'
        },
        execution: {
          status: 'success',
          order_id: 'order-789'
        }
      };

      await saveLog(longInputData);

      // Verify in database
      const savedLog = await Log.findOne({ request_id: 'test-long-input-001' });
      
      if (!savedLog) {
        throw new Error('Log not saved to database');
      }

      const storedLength = savedLog.input.raw_input.length;
      console.log(`✓ Original input length: ${longInput.length} chars`);
      console.log(`✓ Stored input length: ${storedLength} chars`);

      if (storedLength > 500) {
        throw new Error(`Expected length ≤ 500, got ${storedLength}`);
      }

      if (storedLength !== 500) {
        throw new Error(`Expected exactly 500 chars (trimmed), got ${storedLength}`);
      }

      console.log('✓ Input correctly trimmed to 500 characters');
      console.log('RESULT: PASS\n');
      passCount++;
    } catch (error) {
      console.log('✗ RESULT: FAIL');
      console.log(`  Error: ${error.message}\n`);
      failCount++;
    }

    // TEST 2: matched_rule FIELD
    console.log('TEST 2: matched_rule FIELD');
    console.log('-'.repeat(60));
    try {
      const matchedRuleData = {
        request_id: 'test-matched-rule-002',
        timestamp: '2026-04-03T20:05:00Z',
        input: { raw_input: 'test input' },
        enforcement: {
          decision: 'BLOCK',
          matched_rule: 'DENY_TRADE_IF_NOT_ALLOWED',
          reason: 'Trade not allowed'
        },
        execution: {
          status: 'blocked'
        }
      };

      await saveLog(matchedRuleData);

      // Verify in database
      const savedLog = await Log.findOne({ request_id: 'test-matched-rule-002' });
      
      if (!savedLog) {
        throw new Error('Log not saved to database');
      }

      // Check matched_rule exists at top level
      if (!savedLog.matched_rule) {
        throw new Error('matched_rule not found at top level');
      }
      console.log('✓ matched_rule exists at top level');

      // Check it matches enforcement.matched_rule
      if (savedLog.matched_rule !== savedLog.enforcement.matched_rule) {
        throw new Error(`Top-level matched_rule "${savedLog.matched_rule}" does not match enforcement.matched_rule "${savedLog.enforcement.matched_rule}"`);
      }
      console.log('✓ matched_rule matches enforcement.matched_rule');

      // Verify the value
      if (savedLog.matched_rule !== 'DENY_TRADE_IF_NOT_ALLOWED') {
        throw new Error(`Expected "DENY_TRADE_IF_NOT_ALLOWED", got "${savedLog.matched_rule}"`);
      }
      console.log('✓ matched_rule value correct: "DENY_TRADE_IF_NOT_ALLOWED"');

      // Test query by matched_rule
      const queryResult = await Log.find({ matched_rule: 'DENY_TRADE_IF_NOT_ALLOWED' });
      if (queryResult.length === 0) {
        throw new Error('Query by matched_rule returned no results');
      }
      console.log('✓ Query by matched_rule works');

      console.log('RESULT: PASS\n');
      passCount++;
    } catch (error) {
      console.log('✗ RESULT: FAIL');
      console.log(`  Error: ${error.message}\n`);
      failCount++;
    }

    // TEST 3: ERROR TRIMMING
    console.log('TEST 3: ERROR TRIMMING');
    console.log('-'.repeat(60));
    try {
      const longError = 'Error: ' + 'x'.repeat(1000); // 1007 characters
      
      const errorData = {
        request_id: 'test-error-trim-003',
        timestamp: '2026-04-03T20:10:00Z',
        input: { raw_input: 'test' },
        enforcement: {
          decision: 'ALLOW',
          matched_rule: 'ALLOW_TRADE_WITH_LIMIT'
        },
        execution: {
          status: 'failed',
          error_type: 'API_ERROR',
          error: longError
        }
      };

      await saveLog(errorData);

      // Verify in database
      const savedLog = await Log.findOne({ request_id: 'test-error-trim-003' });
      
      if (!savedLog) {
        throw new Error('Log not saved to database');
      }

      const storedErrorLength = savedLog.execution.error.length;
      console.log(`✓ Original error length: ${longError.length} chars`);
      console.log(`✓ Stored error length: ${storedErrorLength} chars`);

      if (storedErrorLength > 300) {
        throw new Error(`Expected length ≤ 300, got ${storedErrorLength}`);
      }

      if (storedErrorLength !== 300) {
        throw new Error(`Expected exactly 300 chars (trimmed), got ${storedErrorLength}`);
      }

      console.log('✓ Error correctly trimmed to 300 characters');
      console.log('RESULT: PASS\n');
      passCount++;
    } catch (error) {
      console.log('✗ RESULT: FAIL');
      console.log(`  Error: ${error.message}\n`);
      failCount++;
    }

    // TEST 4: REGRESSION - Re-run previous 5 tests
    console.log('TEST 4: REGRESSION');
    console.log('-'.repeat(60));
    console.log('Re-running original 5 tests to ensure no breaking changes...\n');
    
    let regressionPass = 0;
    let regressionFail = 0;

    // REGRESSION TEST 1: SUCCESS FLOW
    console.log('  REGRESSION 1: Success Flow');
    try {
      const successData = {
        request_id: 'regression-success-001',
        timestamp: '2026-04-03T20:15:00Z',
        input: { raw_input: 'buy 10 shares of AAPL' },
        intent: {
          intent_id: 'intent-reg-001',
          intent_type: 'trade',
          status: 'valid'
        },
        policy: {
          policy_id: 'policy-reg-001',
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
          order_id: 'order-reg-123'
        },
        timing: { total_ms: 245 }
      };

      await saveLog(successData);
      const savedLog = await Log.findOne({ request_id: 'regression-success-001' });
      
      if (savedLog.final_status !== 'allowed' || savedLog.severity !== 'INFO') {
        throw new Error('Status/severity incorrect');
      }
      console.log('  ✓ Success flow: PASS');
      regressionPass++;
    } catch (error) {
      console.log(`  ✗ Success flow: FAIL - ${error.message}`);
      regressionFail++;
    }

    // REGRESSION TEST 2: BLOCKED FLOW
    console.log('  REGRESSION 2: Blocked Flow');
    try {
      const blockedData = {
        request_id: 'regression-blocked-002',
        timestamp: '2026-04-03T20:20:00Z',
        input: { raw_input: 'analyze TSLA stock' },
        enforcement: {
          decision: 'BLOCK',
          matched_rule: 'DENY_TRADE_IF_NOT_ALLOWED',
          reason: 'Trade not allowed'
        },
        execution: {
          status: 'blocked'
        }
      };

      await saveLog(blockedData);
      const savedLog = await Log.findOne({ request_id: 'regression-blocked-002' });
      
      if (savedLog.final_status !== 'blocked' || savedLog.severity !== 'WARN') {
        throw new Error('Status/severity incorrect');
      }
      console.log('  ✓ Blocked flow: PASS');
      regressionPass++;
    } catch (error) {
      console.log(`  ✗ Blocked flow: FAIL - ${error.message}`);
      regressionFail++;
    }

    // REGRESSION TEST 3: FAILED EXECUTION
    console.log('  REGRESSION 3: Failed Execution');
    try {
      const failedData = {
        request_id: 'regression-failed-003',
        timestamp: '2026-04-03T20:25:00Z',
        input: { raw_input: 'buy 100 shares of INVALID' },
        enforcement: {
          decision: 'ALLOW',
          matched_rule: 'ALLOW_TRADE_WITH_LIMIT'
        },
        execution: {
          status: 'failed',
          error_type: 'API_ERROR',
          error: 'symbol INVALID is not found'
        }
      };

      await saveLog(failedData);
      const savedLog = await Log.findOne({ request_id: 'regression-failed-003' });
      
      if (savedLog.final_status !== 'failed' || savedLog.severity !== 'ERROR') {
        throw new Error('Status/severity incorrect');
      }
      console.log('  ✓ Failed execution: PASS');
      regressionPass++;
    } catch (error) {
      console.log(`  ✗ Failed execution: FAIL - ${error.message}`);
      regressionFail++;
    }

    // REGRESSION TEST 4: DATA INTEGRITY
    console.log('  REGRESSION 4: Data Integrity');
    try {
      const integrityData = {
        request_id: 'regression-integrity-004',
        timestamp: '2026-04-03T20:30:00Z',
        input: { raw_input: 'buy 5 shares of NVDA' },
        intent: {
          intent_id: 'intent-reg-004',
          intent_type: 'trade',
          status: 'valid'
        },
        policy: {
          policy_id: 'policy-reg-004',
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
          trace: []
        },
        execution: {
          status: 'success',
          order_id: 'order-reg-456'
        }
      };

      await saveLog(integrityData);
      const savedLog = await Log.findOne({ request_id: 'regression-integrity-004' });
      
      if (!savedLog.request_id || !savedLog.intent || !savedLog.enforcement || !savedLog.execution) {
        throw new Error('Data integrity check failed');
      }
      console.log('  ✓ Data integrity: PASS');
      regressionPass++;
    } catch (error) {
      console.log(`  ✗ Data integrity: FAIL - ${error.message}`);
      regressionFail++;
    }

    // REGRESSION TEST 5: FAIL SAFE
    console.log('  REGRESSION 5: Fail Safe');
    try {
      // Disconnect to simulate error
      await mongoose.connection.close();
      
      const failSafeData = {
        request_id: 'regression-failsafe-005',
        execution: { status: 'success' }
      };

      // Should not throw
      await saveLog(failSafeData);
      console.log('  ✓ Fail safe: PASS');
      regressionPass++;
      
      // Reconnect for summary
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cognis_test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    } catch (error) {
      console.log(`  ✗ Fail safe: FAIL - ${error.message}`);
      regressionFail++;
    }

    console.log();
    console.log(`Regression Tests: ${regressionPass}/5 passed`);
    
    if (regressionFail === 0) {
      console.log('✓ All regression tests passed');
      console.log('RESULT: PASS\n');
      passCount++;
    } else {
      console.log(`✗ ${regressionFail} regression test(s) failed`);
      console.log('RESULT: FAIL\n');
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
      console.log('\n🎉 ALL TESTS PASSED! Logging fixes validated.\n');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED. Review errors above.\n');
    }

  } catch (error) {
    console.error('Test suite error:', error);
  } finally {
    // Close connection if still open
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(failCount > 0 ? 1 : 0);
  }
}

// Run tests
runTests();
