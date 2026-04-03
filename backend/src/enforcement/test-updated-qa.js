const { enforce } = require('./enforce');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║    UPDATED ENFORCEMENT ENGINE - QA TEST SUITE              ║');
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
    policy_id: 'updated-qa-policy',
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

// TEST 1: RESPONSE STRUCTURE
test(1, 'RESPONSE STRUCTURE - All Required Fields', () => {
  console.log('Input: Multiple scenarios to validate response structure');
  
  const scenarios = [
    {
      name: 'ALLOW response',
      request: {
        request_id: 'structure-test-001',
        timestamp: '2026-04-03T14:00:00Z',
        intent: {
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
      }
    },
    {
      name: 'BLOCK response (DENY rule)',
      request: {
        request_id: 'structure-test-002',
        timestamp: '2026-04-03T14:01:00Z',
        intent: {
          status: 'ambiguous',
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
      }
    },
    {
      name: 'BLOCK response (schema error)',
      request: {
        request_id: 'structure-test-003',
        timestamp: '2026-04-03T14:02:00Z',
        intent: {
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
          // missing asset
          amount: 500
        }
      }
    },
    {
      name: 'BLOCK response (DEFAULT_DENY)',
      request: {
        request_id: 'structure-test-004',
        timestamp: '2026-04-03T14:03:00Z',
        intent: {
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
          asset: 'TSLA',  // unauthorized
          amount: 500
        }
      }
    }
  ];
  
  const issues = [];
  const requiredFields = ['request_id', 'timestamp', 'decision', 'matched_rule', 'reason', 'trace'];
  
  scenarios.forEach((scenario, index) => {
    console.log(`\nScenario ${index + 1}: ${scenario.name}`);
    const result = enforce(scenario.request);
    
    // Check all required fields
    requiredFields.forEach(field => {
      if (result[field] !== undefined) {
        console.log(`  ✅ ${field}: present`);
      } else {
        console.log(`  ❌ ${field}: MISSING`);
        issues.push(`${scenario.name}: ${field} missing`);
      }
    });
    
    // Verify request_id matches
    if (result.request_id === scenario.request.request_id) {
      console.log(`  ✅ request_id matches input`);
    } else {
      console.log(`  ❌ request_id mismatch`);
      issues.push(`${scenario.name}: request_id mismatch`);
    }
    
    // Verify timestamp matches
    if (result.timestamp === scenario.request.timestamp) {
      console.log(`  ✅ timestamp matches input`);
    } else {
      console.log(`  ❌ timestamp mismatch`);
      issues.push(`${scenario.name}: timestamp mismatch`);
    }
  });
  
  return { passed: issues.length === 0, issues };
});

// TEST 2: DEFAULT DENY RULE
test(2, 'DEFAULT DENY RULE - Unknown Action', () => {
  console.log('Input: Unknown action type (withdraw)');
  
  const request = {
    request_id: 'default-deny-test-001',
    timestamp: '2026-04-03T14:10:00Z',
    intent: {
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
    issues.push('Decision should be BLOCK');
  }
  
  // Check matched_rule = DEFAULT_DENY
  if (result.matched_rule === 'DEFAULT_DENY') {
    console.log('✅ matched_rule = DEFAULT_DENY');
  } else {
    console.log(`❌ matched_rule = ${result.matched_rule} (expected: DEFAULT_DENY)`);
    issues.push('Matched rule should be DEFAULT_DENY');
  }
  
  // Check reason
  if (result.reason === 'Deny all unspecified actions') {
    console.log('✅ reason = "Deny all unspecified actions"');
  } else {
    console.log(`❌ reason = "${result.reason}" (expected: "Deny all unspecified actions")`);
    issues.push('Reason should be "Deny all unspecified actions"');
  }
  
  return { passed: issues.length === 0, issues };
});

// TEST 3: VALID TRADE
test(3, 'VALID TRADE - request_id and timestamp Present', () => {
  console.log('Input: Valid trade within limits');
  
  const request = {
    request_id: 'valid-trade-test-001',
    timestamp: '2026-04-03T14:20:00Z',
    intent: {
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
  console.log(`request_id: ${result.request_id}`);
  console.log(`timestamp: ${result.timestamp}`);
  
  // Check request_id present
  if (result.request_id === 'valid-trade-test-001') {
    console.log('✅ request_id present and correct');
  } else {
    console.log(`❌ request_id = ${result.request_id} (expected: valid-trade-test-001)`);
    issues.push('request_id missing or incorrect');
  }
  
  // Check timestamp present
  if (result.timestamp === '2026-04-03T14:20:00Z') {
    console.log('✅ timestamp present and correct');
  } else {
    console.log(`❌ timestamp = ${result.timestamp} (expected: 2026-04-03T14:20:00Z)`);
    issues.push('timestamp missing or incorrect');
  }
  
  // Check matched_rule = ALLOW_TRADE_WITH_LIMIT
  if (result.matched_rule === 'ALLOW_TRADE_WITH_LIMIT') {
    console.log('✅ matched_rule = ALLOW_TRADE_WITH_LIMIT');
  } else {
    console.log(`❌ matched_rule = ${result.matched_rule} (expected: ALLOW_TRADE_WITH_LIMIT)`);
    issues.push('Matched rule should be ALLOW_TRADE_WITH_LIMIT');
  }
  
  // Check decision = ALLOW
  if (result.decision === 'ALLOW') {
    console.log('✅ decision = ALLOW');
  } else {
    console.log(`❌ decision = ${result.decision} (expected: ALLOW)`);
    issues.push('Decision should be ALLOW');
  }
  
  return { passed: issues.length === 0, issues };
});

// TEST 4: BLOCKED TRADE
test(4, 'BLOCKED TRADE - Analysis Intent', () => {
  console.log('Input: Analysis intent attempting trade');
  
  const request = {
    request_id: 'blocked-trade-test-001',
    timestamp: '2026-04-03T14:30:00Z',
    intent: {
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
  console.log(`request_id: ${result.request_id}`);
  console.log(`timestamp: ${result.timestamp}`);
  
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
  
  // Check request_id present
  if (result.request_id === 'blocked-trade-test-001') {
    console.log('✅ request_id present and correct');
  } else {
    console.log(`❌ request_id missing or incorrect`);
    issues.push('request_id missing or incorrect');
  }
  
  // Check timestamp present
  if (result.timestamp === '2026-04-03T14:30:00Z') {
    console.log('✅ timestamp present and correct');
  } else {
    console.log(`❌ timestamp missing or incorrect`);
    issues.push('timestamp missing or incorrect');
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
  console.log('🎉 ALL TESTS PASSED! Updated enforcement engine validated.\n');
} else {
  console.log('⚠️  SOME TESTS FAILED. Review failures above.\n');
  process.exit(1);
}
