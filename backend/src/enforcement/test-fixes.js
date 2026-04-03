const { enforce } = require('./enforce');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       ENFORCEMENT ENGINE - FIXES VALIDATION                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Helper function to create test policy
function createTestPolicy() {
  return {
    policy_id: 'test-policy',
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

// FIX 1: request_id and timestamp in ALLOW response
test(1, 'FIX 1: request_id and timestamp in ALLOW response', () => {
  const request = {
    request_id: 'fix-test-001',
    timestamp: '2026-04-03T12:00:00Z',
    intent: {
      intent_id: 'intent-001',
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
  
  console.log('Response fields:');
  console.log(`  request_id: ${result.request_id}`);
  console.log(`  timestamp: ${result.timestamp}`);
  console.log(`  decision: ${result.decision}`);
  console.log(`  matched_rule: ${result.matched_rule}`);
  console.log(`  reason: ${result.reason}`);
  console.log(`  trace: ${result.trace ? 'present' : 'missing'}`);
  
  const hasRequestId = result.request_id === 'fix-test-001';
  const hasTimestamp = result.timestamp === '2026-04-03T12:00:00Z';
  
  if (hasRequestId) {
    console.log('\n✅ request_id included in response');
  } else {
    console.log('\n❌ request_id missing or incorrect');
  }
  
  if (hasTimestamp) {
    console.log('✅ timestamp included in response');
  } else {
    console.log('❌ timestamp missing or incorrect');
  }
  
  return { passed: hasRequestId && hasTimestamp };
});

// FIX 1: request_id and timestamp in BLOCK response (DENY rule)
test(2, 'FIX 1: request_id and timestamp in BLOCK response (DENY)', () => {
  const request = {
    request_id: 'fix-test-002',
    timestamp: '2026-04-03T12:05:00Z',
    intent: {
      intent_id: 'intent-002',
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
  };
  
  const result = enforce(request);
  
  console.log('Response fields:');
  console.log(`  request_id: ${result.request_id}`);
  console.log(`  timestamp: ${result.timestamp}`);
  console.log(`  decision: ${result.decision}`);
  console.log(`  matched_rule: ${result.matched_rule}`);
  
  const hasRequestId = result.request_id === 'fix-test-002';
  const hasTimestamp = result.timestamp === '2026-04-03T12:05:00Z';
  
  if (hasRequestId) {
    console.log('\n✅ request_id included in BLOCK response');
  } else {
    console.log('\n❌ request_id missing or incorrect');
  }
  
  if (hasTimestamp) {
    console.log('✅ timestamp included in BLOCK response');
  } else {
    console.log('❌ timestamp missing or incorrect');
  }
  
  return { passed: hasRequestId && hasTimestamp };
});

// FIX 1: request_id and timestamp in schema validation error
test(3, 'FIX 1: request_id and timestamp in schema validation error', () => {
  const request = {
    request_id: 'fix-test-003',
    timestamp: '2026-04-03T12:10:00Z',
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
  
  console.log('Response fields:');
  console.log(`  request_id: ${result.request_id}`);
  console.log(`  timestamp: ${result.timestamp}`);
  console.log(`  decision: ${result.decision}`);
  console.log(`  reason: ${result.reason}`);
  
  const hasRequestId = result.request_id === 'fix-test-003';
  const hasTimestamp = result.timestamp === '2026-04-03T12:10:00Z';
  
  if (hasRequestId) {
    console.log('\n✅ request_id included in schema error response');
  } else {
    console.log('\n❌ request_id missing or incorrect');
  }
  
  if (hasTimestamp) {
    console.log('✅ timestamp included in schema error response');
  } else {
    console.log('❌ timestamp missing or incorrect');
  }
  
  return { passed: hasRequestId && hasTimestamp };
});

// FIX 2: DEFAULT_DENY matched_rule
test(4, 'FIX 2: DEFAULT_DENY matched_rule for no match', () => {
  const request = {
    request_id: 'fix-test-004',
    timestamp: '2026-04-03T12:15:00Z',
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
      asset: 'TSLA',  // NOT IN ALLOWED_ASSETS
      amount: 500
    }
  };
  
  const result = enforce(request);
  
  console.log('Response fields:');
  console.log(`  decision: ${result.decision}`);
  console.log(`  matched_rule: ${result.matched_rule}`);
  console.log(`  reason: ${result.reason}`);
  
  const isBlock = result.decision === 'BLOCK';
  const matchedRuleIsDefaultDeny = result.matched_rule === 'DEFAULT_DENY';
  const reasonCorrect = result.reason === 'Deny all unspecified actions';
  
  if (isBlock) {
    console.log('\n✅ decision = BLOCK');
  } else {
    console.log('\n❌ decision should be BLOCK');
  }
  
  if (matchedRuleIsDefaultDeny) {
    console.log('✅ matched_rule = "DEFAULT_DENY" (not null)');
  } else {
    console.log(`❌ matched_rule = ${result.matched_rule} (expected: "DEFAULT_DENY")`);
  }
  
  if (reasonCorrect) {
    console.log('✅ reason = "Deny all unspecified actions"');
  } else {
    console.log(`❌ reason = "${result.reason}"`);
  }
  
  return { passed: isBlock && matchedRuleIsDefaultDeny && reasonCorrect };
});

// CONSISTENCY CHECK: All fields present
test(5, 'CONSISTENCY: All required fields in all responses', () => {
  const scenarios = [
    {
      name: 'ALLOW response',
      request: {
        request_id: 'consistency-001',
        timestamp: '2026-04-03T12:20:00Z',
        intent: {
          status: 'valid',
          allowed_actions: ['trade'],
          constraints: { max_trade_amount: 1000, allowed_assets: ['AAPL'] }
        },
        policy: createTestPolicy(),
        action: { type: 'trade', asset: 'AAPL', amount: 500 }
      }
    },
    {
      name: 'BLOCK response (DENY rule)',
      request: {
        request_id: 'consistency-002',
        timestamp: '2026-04-03T12:21:00Z',
        intent: {
          status: 'ambiguous',
          allowed_actions: ['trade'],
          constraints: { max_trade_amount: 1000, allowed_assets: ['AAPL'] }
        },
        policy: createTestPolicy(),
        action: { type: 'trade', asset: 'AAPL', amount: 500 }
      }
    },
    {
      name: 'BLOCK response (schema error)',
      request: {
        request_id: 'consistency-003',
        timestamp: '2026-04-03T12:22:00Z',
        intent: {
          status: 'valid',
          allowed_actions: ['trade'],
          constraints: { max_trade_amount: 1000, allowed_assets: ['AAPL'] }
        },
        policy: createTestPolicy(),
        action: { type: 'trade', amount: 500 }  // missing asset
      }
    },
    {
      name: 'BLOCK response (DEFAULT_DENY)',
      request: {
        request_id: 'consistency-004',
        timestamp: '2026-04-03T12:23:00Z',
        intent: {
          status: 'valid',
          allowed_actions: ['trade'],
          constraints: { max_trade_amount: 1000, allowed_assets: ['AAPL'] }
        },
        policy: createTestPolicy(),
        action: { type: 'trade', asset: 'TSLA', amount: 500 }  // unauthorized asset
      }
    }
  ];
  
  let allPassed = true;
  
  scenarios.forEach(scenario => {
    console.log(`\nChecking ${scenario.name}:`);
    const result = enforce(scenario.request);
    
    const requiredFields = ['request_id', 'timestamp', 'decision', 'matched_rule', 'reason', 'trace'];
    const missingFields = [];
    
    requiredFields.forEach(field => {
      if (result[field] === undefined) {
        missingFields.push(field);
        allPassed = false;
      }
    });
    
    if (missingFields.length === 0) {
      console.log('  ✅ All required fields present');
    } else {
      console.log(`  ❌ Missing fields: ${missingFields.join(', ')}`);
    }
  });
  
  return { passed: allPassed };
});

// Sample final response object
console.log('\n\n╔════════════════════════════════════════════════════════════╗');
console.log('║              SAMPLE FINAL RESPONSE OBJECT                  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const sampleRequest = {
  request_id: 'sample-request-001',
  timestamp: '2026-04-03T12:30:00Z',
  intent: {
    intent_id: 'intent-sample',
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

const sampleResult = enforce(sampleRequest);

console.log(JSON.stringify(sampleResult, null, 2));

// Summary
console.log('\n\n╔════════════════════════════════════════════════════════════╗');
console.log('║                    TEST SUMMARY                            ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log(`\nTotal Tests: ${passCount + failCount}`);
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%\n`);

if (failCount === 0) {
  console.log('🎉 ALL FIXES VALIDATED! Module updated successfully.\n');
} else {
  console.log('⚠️  SOME TESTS FAILED. Review failures above.\n');
  process.exit(1);
}
