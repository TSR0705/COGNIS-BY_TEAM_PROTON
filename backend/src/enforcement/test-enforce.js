const { enforce } = require('./enforce');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         ENFORCEMENT ENGINE - BASIC TESTS                   ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Helper function to create test policy
function createTestPolicy() {
  return {
    policy_id: 'test-policy-001',
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

let passCount = 0;
let failCount = 0;

function test(testNum, testName, testFn) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`TEST ${testNum}: ${testName}`);
  console.log(`${'═'.repeat(60)}\n`);
  
  try {
    const result = testFn();
    if (result.passed) {
      console.log('✅ PASS\n');
      passCount++;
    } else {
      console.log('❌ FAIL\n');
      failCount++;
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}\n`);
    failCount++;
  }
}

// TEST 1: ALLOW - Valid Trade
test(1, 'ALLOW - Valid Trade Within Limits', () => {
  const request = {
    request_id: 'test-001',
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
  
  console.log(`Decision: ${result.decision}`);
  console.log(`Matched Rule: ${result.matched_rule}`);
  console.log(`Reason: ${result.reason}`);
  
  const passed = result.decision === 'ALLOW' && 
                 result.matched_rule === 'ALLOW_TRADE_WITH_LIMIT';
  
  return { passed };
});

// TEST 2: BLOCK - Amount Exceeds Limit
test(2, 'BLOCK - Amount Exceeds Limit', () => {
  const request = {
    request_id: 'test-002',
    timestamp: '2026-04-03T10:05:00Z',
    intent: {
      intent_id: 'intent-002',
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
      amount: 5000  // EXCEEDS
    }
  };
  
  const result = enforce(request);
  
  console.log(`Decision: ${result.decision}`);
  console.log(`Matched Rule: ${result.matched_rule}`);
  console.log(`Reason: ${result.reason}`);
  
  const passed = result.decision === 'BLOCK';
  
  return { passed };
});

// TEST 3: BLOCK - Ambiguous Intent
test(3, 'BLOCK - Ambiguous Intent', () => {
  const request = {
    request_id: 'test-003',
    timestamp: '2026-04-03T10:10:00Z',
    intent: {
      intent_id: 'intent-003',
      status: 'ambiguous',  // AMBIGUOUS
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
      amount: 100
    }
  };
  
  const result = enforce(request);
  
  console.log(`Decision: ${result.decision}`);
  console.log(`Matched Rule: ${result.matched_rule}`);
  console.log(`Reason: ${result.reason}`);
  
  const passed = result.decision === 'BLOCK' && 
                 result.matched_rule === 'DENY_IF_INTENT_INVALID';
  
  return { passed };
});

// TEST 4: BLOCK - Unauthorized Asset
test(4, 'BLOCK - Unauthorized Asset', () => {
  const request = {
    request_id: 'test-004',
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
      type: 'trade',
      asset: 'TSLA',  // NOT ALLOWED
      amount: 500
    }
  };
  
  const result = enforce(request);
  
  console.log(`Decision: ${result.decision}`);
  console.log(`Matched Rule: ${result.matched_rule}`);
  console.log(`Reason: ${result.reason}`);
  
  const passed = result.decision === 'BLOCK';
  
  return { passed };
});

// TEST 5: BLOCK - Invalid Action Schema
test(5, 'BLOCK - Invalid Action Schema (Missing Asset)', () => {
  const request = {
    request_id: 'test-005',
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
      // MISSING asset
      amount: 500
    }
  };
  
  const result = enforce(request);
  
  console.log(`Decision: ${result.decision}`);
  console.log(`Reason: ${result.reason}`);
  
  const passed = result.decision === 'BLOCK' && 
                 result.reason.includes('Invalid action schema');
  
  return { passed };
});

// TEST 6: BLOCK - Trade Not Allowed
test(6, 'BLOCK - Trade Not Allowed in Intent', () => {
  const request = {
    request_id: 'test-006',
    timestamp: '2026-04-03T10:25:00Z',
    intent: {
      intent_id: 'intent-006',
      status: 'valid',
      allowed_actions: ['read_data'],  // NO TRADE
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
  
  console.log(`Decision: ${result.decision}`);
  console.log(`Matched Rule: ${result.matched_rule}`);
  console.log(`Reason: ${result.reason}`);
  
  const passed = result.decision === 'BLOCK' && 
                 result.matched_rule === 'DENY_TRADE_IF_NOT_ALLOWED';
  
  return { passed };
});

// TEST 7: Trace Validation
test(7, 'Trace Contains Rule Evaluation Details', () => {
  const request = {
    request_id: 'test-007',
    timestamp: '2026-04-03T10:30:00Z',
    intent: {
      intent_id: 'intent-007',
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
      amount: 500
    }
  };
  
  const result = enforce(request);
  
  console.log(`Trace entries: ${result.trace.length}`);
  
  // Check trace structure
  const hasValidTrace = result.trace.length > 0 &&
                        result.trace.every(entry => 
                          entry.rule_id && 
                          typeof entry.applied === 'boolean'
                        );
  
  console.log(`Valid trace structure: ${hasValidTrace}`);
  
  // Check that matched rule is in trace
  const matchedInTrace = result.trace.some(entry => 
    entry.rule_id === result.matched_rule && 
    entry.all_conditions_passed === true
  );
  
  console.log(`Matched rule in trace: ${matchedInTrace}`);
  
  const passed = hasValidTrace && matchedInTrace;
  
  return { passed };
});

// Summary
console.log('\n\n╔════════════════════════════════════════════════════════════╗');
console.log('║                    TEST SUMMARY                            ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log(`\nTotal Tests: ${passCount + failCount}`);
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%\n`);

if (failCount === 0) {
  console.log('🎉 ALL TESTS PASSED! Enforcement engine is working correctly.\n');
} else {
  console.log('⚠️  SOME TESTS FAILED. Review failures above.\n');
  process.exit(1);
}
