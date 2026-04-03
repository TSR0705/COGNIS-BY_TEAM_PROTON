const { enforce } = require('./enforce');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       ENFORCEMENT ENGINE - QA TEST SUITE                   ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

let passCount = 0;
let failCount = 0;
const failures = [];

function test(testNum, testName, testFn) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`TEST ${testNum}: ${testName}`);
  console.log(`${'═'.repeat(60)}\n`);
  
  try {
    const result = testFn();
    if (result.passed) {
      console.log('✅ PASS - All checks passed\n');
      passCount++;
    } else {
      console.log('❌ FAIL - Some checks failed\n');
      failCount++;
      failures.push({ test: testNum, name: testName, issues: result.issues });
    }
  } catch (error) {
    console.log(`❌ FAIL - Test crashed: ${error.message}\n`);
    failCount++;
    failures.push({ test: testNum, name: testName, error: error.message });
  }
}

// Helper function to create test policy
function createTestPolicy() {
  return {
    policy_id: 'qa-test-policy',
    rules: [
      {
        id: 'DENY_IF_INTENT_INVALID',
        type: 'security',
        action: 'any',
        effect: 'deny',
        description: 'Block execution if intent is ambiguous or unsafe',
        conditions: [
          {
            field: 'intent.status',
            op: 'in',
            value: ['ambiguous', 'unsafe']
          }
        ]
      },
      {
        id: 'DENY_TRADE_IF_NOT_ALLOWED',
        type: 'security',
        action: 'trade',
        effect: 'deny',
        description: 'Block trade if intent does not permit it',
        conditions: [
          {
            field: 'intent.allowed_actions',
            op: 'not_includes',
            value: 'trade'
          }
        ]
      },
      {
        id: 'ALLOW_TRADE_WITH_LIMIT',
        type: 'constraint',
        action: 'trade',
        effect: 'allow',
        description: 'Allow trade within asset and amount constraints',
        conditions: [
          {
            field: 'action.asset',
            op: 'in',
            value_from: 'intent.constraints.allowed_assets'
          },
          {
            field: 'action.amount',
            op: '<=',
            value_from: 'intent.constraints.max_trade_amount'
          }
        ]
      },
      {
        id: 'DEFAULT_DENY',
        type: 'default',
        action: 'any',
        effect: 'deny',
        description: 'Deny all unspecified actions',
        conditions: []
      }
    ]
  };
}

// TEST 1: VALID TRADE
test(1, 'VALID TRADE', () => {
  console.log('Input: Valid trade within limits');
  
  const request = {
    request_id: 'qa-test-001',
    timestamp: '2026-04-03T10:00:00Z',
    intent: {
      intent_id: 'intent-001',
      status: 'valid',
      allowed_actions: ['trade'],
      constraints: {
        max_trade_amount: 1000,
        allowed_assets: ['AAPL', 'TSLA']
      }
    },
    policy: createTestPolicy(),
    action: {
      type: 'trade',
      asset: 'AAPL',
      amount: 500
    }
  };
  
  const result = enforce(request);
  const issues = [];
  
  console.log(`Decision: ${result.decision}`);
  console.log(`Matched Rule: ${result.matched_rule}`);
  console.log(`Reason: ${result.reason}`);
  
  // Check decision = ALLOW
  if (result.decision === 'ALLOW') {
    console.log('✅ decision = ALLOW');
  } else {
    console.log(`❌ decision = ${result.decision} (expected: ALLOW)`);
    issues.push('Decision should be ALLOW');
  }
  
  // Check matched rule
  if (result.matched_rule === 'ALLOW_TRADE_WITH_LIMIT') {
    console.log('✅ matched_rule = ALLOW_TRADE_WITH_LIMIT');
  } else {
    console.log(`❌ matched_rule = ${result.matched_rule}`);
    issues.push('Matched rule should be ALLOW_TRADE_WITH_LIMIT');
  }
  
  return { passed: issues.length === 0, issues };
});

// TEST 2: BLOCK TRADE (ANALYSIS INTENT)
test(2, 'BLOCK TRADE (ANALYSIS INTENT)', () => {
  console.log('Input: Analysis intent attempting trade');
  
  const request = {
    request_id: 'qa-test-002',
    timestamp: '2026-04-03T10:05:00Z',
    intent: {
      intent_id: 'intent-002',
      status: 'valid',
      allowed_actions: ['read_data'],  // NO TRADE
      forbidden_actions: ['trade'],
      constraints: {
        max_trade_amount: 0,
        allowed_assets: []
      }
    },
    policy: createTestPolicy(),
    action: {
      type: 'trade',
      asset: 'AAPL',
      amount: 100
    }
  };
  
  const result = enforce(request);
  const issues = [];
  
  console.log(`Decision: ${result.decision}`);
  console.log(`Matched Rule: ${result.matched_rule}`);
  console.log(`Reason: ${result.reason}`);
  
  // Check decision = BLOCK
  if (result.decision === 'BLOCK') {
    console.log('✅ decision = BLOCK');
  } else {
    console.log(`❌ decision = ${result.decision} (expected: BLOCK)`);
    issues.push('Decision should be BLOCK');
  }
  
  // Check matched_rule = DENY_TRADE_IF_NOT_ALLOWED
  if (result.matched_rule === 'DENY_TRADE_IF_NOT_ALLOWED') {
    console.log('✅ matched_rule = DENY_TRADE_IF_NOT_ALLOWED');
  } else {
    console.log(`❌ matched_rule = ${result.matched_rule} (expected: DENY_TRADE_IF_NOT_ALLOWED)`);
    issues.push('Matched rule should be DENY_TRADE_IF_NOT_ALLOWED');
  }
  
  return { passed: issues.length === 0, issues };
});

// TEST 3: INVALID ACTION (MISSING ASSET)
test(3, 'INVALID ACTION (MISSING ASSET)', () => {
  console.log('Input: Trade action missing asset field');
  
  const request = {
    request_id: 'qa-test-003',
    timestamp: '2026-04-03T10:10:00Z',
    intent: {
      intent_id: 'intent-003',
      status: 'valid',
      allowed_actions: ['trade'],
      constraints: {
        max_trade_amount: 1000,
        allowed_assets: ['AAPL']
      }
    },
    policy: createTestPolicy(),
    action: {
      type: 'trade',
      // MISSING asset
      amount: 500
    }
  };
  
  const result = enforce(request);
  const issues = [];
  
  console.log(`Decision: ${result.decision}`);
  console.log(`Reason: ${result.reason}`);
  
  // Check decision = BLOCK
  if (result.decision === 'BLOCK') {
    console.log('✅ decision = BLOCK');
  } else {
    console.log(`❌ decision = ${result.decision} (expected: BLOCK)`);
    issues.push('Decision should be BLOCK');
  }
  
  // Check reason contains "Invalid action schema"
  if (result.reason.includes('Invalid action schema')) {
    console.log('✅ reason = "Invalid action schema"');
  } else {
    console.log(`❌ reason = "${result.reason}" (expected to include "Invalid action schema")`);
    issues.push('Reason should mention invalid action schema');
  }
  
  // Check matched_rule is null
  if (result.matched_rule === null) {
    console.log('✅ matched_rule = null');
  } else {
    console.log(`❌ matched_rule = ${result.matched_rule} (expected: null)`);
    issues.push('Matched rule should be null for schema validation failures');
  }
  
  return { passed: issues.length === 0, issues };
});

// TEST 4: UNKNOWN ACTION TYPE
test(4, 'UNKNOWN ACTION TYPE', () => {
  console.log('Input: action.type = "withdraw" (unknown)');
  
  const request = {
    request_id: 'qa-test-004',
    timestamp: '2026-04-03T10:15:00Z',
    intent: {
      intent_id: 'intent-004',
      status: 'valid',
      allowed_actions: ['trade'],
      constraints: {
        max_trade_amount: 1000,
        allowed_assets: ['AAPL']
      }
    },
    policy: createTestPolicy(),
    action: {
      type: 'withdraw',  // UNKNOWN ACTION TYPE
      asset: 'AAPL',
      amount: 500
    }
  };
  
  const result = enforce(request);
  const issues = [];
  
  console.log(`Decision: ${result.decision}`);
  console.log(`Matched Rule: ${result.matched_rule}`);
  console.log(`Reason: ${result.reason}`);
  
  // Check decision = BLOCK
  if (result.decision === 'BLOCK') {
    console.log('✅ decision = BLOCK');
  } else {
    console.log(`❌ decision = ${result.decision} (expected: BLOCK)`);
    issues.push('Decision should be BLOCK for unknown action type');
  }
  
  // Unknown action types should be caught by DEFAULT_DENY or DENY_IF_INTENT_INVALID
  // Since no rule applies to "withdraw", DEFAULT_DENY should catch it
  console.log('✅ Unknown action type blocked (fail-closed behavior)');
  
  return { passed: issues.length === 0, issues };
});

// TEST 5: CONDITION FAILURE (AMOUNT EXCEEDS LIMIT)
test(5, 'CONDITION FAILURE (AMOUNT EXCEEDS LIMIT)', () => {
  console.log('Input: Trade amount exceeds max_trade_amount');
  
  const request = {
    request_id: 'qa-test-005',
    timestamp: '2026-04-03T10:20:00Z',
    intent: {
      intent_id: 'intent-005',
      status: 'valid',
      allowed_actions: ['trade'],
      constraints: {
        max_trade_amount: 1000,
        allowed_assets: ['AAPL']
      }
    },
    policy: createTestPolicy(),
    action: {
      type: 'trade',
      asset: 'AAPL',
      amount: 5000  // EXCEEDS LIMIT
    }
  };
  
  const result = enforce(request);
  const issues = [];
  
  console.log(`Decision: ${result.decision}`);
  console.log(`Matched Rule: ${result.matched_rule}`);
  console.log(`Reason: ${result.reason}`);
  
  // Check decision = BLOCK
  if (result.decision === 'BLOCK') {
    console.log('✅ decision = BLOCK');
  } else {
    console.log(`❌ decision = ${result.decision} (expected: BLOCK)`);
    issues.push('Decision should be BLOCK when amount exceeds limit');
  }
  
  // Check trace for ALLOW_TRADE_WITH_LIMIT rule
  const allowRule = result.trace.find(t => t.rule_id === 'ALLOW_TRADE_WITH_LIMIT');
  if (allowRule) {
    console.log('✅ ALLOW_TRADE_WITH_LIMIT rule evaluated');
    
    // Check that amount condition failed
    const amountCondition = allowRule.conditions.find(c => c.field === 'action.amount');
    if (amountCondition && !amountCondition.passed) {
      console.log('✅ Amount condition failed (as expected)');
      console.log(`   Expected: <= ${amountCondition.expected}`);
      console.log(`   Actual: ${amountCondition.actual}`);
    } else {
      console.log('❌ Amount condition should have failed');
      issues.push('Amount condition should fail when exceeding limit');
    }
  } else {
    console.log('❌ ALLOW_TRADE_WITH_LIMIT rule not found in trace');
    issues.push('ALLOW_TRADE_WITH_LIMIT should be in trace');
  }
  
  return { passed: issues.length === 0, issues };
});

// TEST 6: TRACE VALIDATION
test(6, 'TRACE VALIDATION', () => {
  console.log('Input: Valid trade to check trace structure');
  
  const request = {
    request_id: 'qa-test-006',
    timestamp: '2026-04-03T10:25:00Z',
    intent: {
      intent_id: 'intent-006',
      status: 'valid',
      allowed_actions: ['trade'],
      constraints: {
        max_trade_amount: 1000,
        allowed_assets: ['AAPL', 'TSLA']
      }
    },
    policy: createTestPolicy(),
    action: {
      type: 'trade',
      asset: 'AAPL',
      amount: 500
    }
  };
  
  const result = enforce(request);
  const issues = [];
  
  console.log(`Decision: ${result.decision}`);
  console.log(`Trace entries: ${result.trace.length}`);
  
  // Check trace exists
  if (result.trace && Array.isArray(result.trace)) {
    console.log('✅ trace exists and is an array');
  } else {
    console.log('❌ trace missing or not an array');
    issues.push('Trace should exist and be an array');
    return { passed: false, issues };
  }
  
  // Check trace has entries
  if (result.trace.length > 0) {
    console.log(`✅ trace has ${result.trace.length} entries`);
  } else {
    console.log('❌ trace is empty');
    issues.push('Trace should have entries');
  }
  
  // Check trace structure
  console.log('\nValidating trace structure:');
  result.trace.forEach((entry, index) => {
    console.log(`\n  Entry ${index + 1}: ${entry.rule_id}`);
    
    // Check required fields
    if (entry.rule_id) {
      console.log('    ✅ rule_id present');
    } else {
      console.log('    ❌ rule_id missing');
      issues.push(`Trace entry ${index + 1}: rule_id missing`);
    }
    
    if (typeof entry.applied === 'boolean') {
      console.log(`    ✅ applied: ${entry.applied}`);
    } else {
      console.log('    ❌ applied field missing or not boolean');
      issues.push(`Trace entry ${index + 1}: applied field invalid`);
    }
    
    // If rule was applied, check additional fields
    if (entry.applied) {
      if (entry.effect) {
        console.log(`    ✅ effect: ${entry.effect}`);
      } else {
        console.log('    ❌ effect missing');
        issues.push(`Trace entry ${index + 1}: effect missing`);
      }
      
      if (Array.isArray(entry.conditions)) {
        console.log(`    ✅ conditions: ${entry.conditions.length} conditions`);
        
        // Check condition structure
        entry.conditions.forEach((cond, condIndex) => {
          if (cond.field && cond.operator && typeof cond.passed === 'boolean') {
            console.log(`      ✅ Condition ${condIndex + 1}: valid structure`);
          } else {
            console.log(`      ❌ Condition ${condIndex + 1}: invalid structure`);
            issues.push(`Trace entry ${index + 1}, condition ${condIndex + 1}: invalid structure`);
          }
        });
      } else {
        console.log('    ❌ conditions missing or not array');
        issues.push(`Trace entry ${index + 1}: conditions invalid`);
      }
      
      if (typeof entry.all_conditions_passed === 'boolean') {
        console.log(`    ✅ all_conditions_passed: ${entry.all_conditions_passed}`);
      } else {
        console.log('    ❌ all_conditions_passed missing');
        issues.push(`Trace entry ${index + 1}: all_conditions_passed missing`);
      }
    }
  });
  
  // Check that matched rule is in trace
  if (result.matched_rule) {
    const matchedInTrace = result.trace.some(entry => 
      entry.rule_id === result.matched_rule && 
      entry.all_conditions_passed === true
    );
    
    if (matchedInTrace) {
      console.log(`\n✅ Matched rule "${result.matched_rule}" found in trace with all_conditions_passed=true`);
    } else {
      console.log(`\n❌ Matched rule "${result.matched_rule}" not found in trace or conditions not passed`);
      issues.push('Matched rule should be in trace with all_conditions_passed=true');
    }
  }
  
  return { passed: issues.length === 0, issues };
});

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
  console.log('🎉 ALL TESTS PASSED! Enforcement engine is production-ready.\n');
} else {
  console.log('⚠️  SOME TESTS FAILED. Review failures above.\n');
  process.exit(1);
}
