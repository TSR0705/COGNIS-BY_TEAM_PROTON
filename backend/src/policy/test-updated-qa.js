const { generatePolicy } = require('./generatePolicy');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║    UPDATED POLICY GENERATION MODULE - QA TEST SUITE        ║');
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

// TEST 1: INVALID INTENT
test(1, 'INVALID INTENT (AMBIGUOUS STATUS)', () => {
  console.log('Input: intent.status = "ambiguous"');
  
  const intent = {
    intent_id: 'test-invalid-001',
    status: 'ambiguous',
    allowed_actions: ['read_data'],
    forbidden_actions: ['trade'],
    constraints: {
      max_trade_amount: 0,
      allowed_assets: ['AAPL']
    }
  };
  
  const policy = generatePolicy(intent);
  const issues = [];
  
  // Check FIRST rule is DENY_IF_INTENT_INVALID
  if (policy.rules.length > 0 && policy.rules[0].id === 'DENY_IF_INTENT_INVALID') {
    console.log('✅ FIRST rule = DENY_IF_INTENT_INVALID');
  } else {
    console.log(`❌ FIRST rule = ${policy.rules[0]?.id || 'NONE'} (expected: DENY_IF_INTENT_INVALID)`);
    issues.push('DENY_IF_INTENT_INVALID is not the first rule');
  }
  
  const firstRule = policy.rules[0];
  
  // Check action = "any"
  if (firstRule.action === 'any') {
    console.log('✅ action = "any"');
  } else {
    console.log(`❌ action = "${firstRule.action}" (expected: "any")`);
    issues.push('DENY_IF_INTENT_INVALID action should be "any"');
  }
  
  // Check effect = "deny"
  if (firstRule.effect === 'deny') {
    console.log('✅ effect = "deny"');
  } else {
    console.log(`❌ effect = "${firstRule.effect}" (expected: "deny")`);
    issues.push('DENY_IF_INTENT_INVALID effect should be "deny"');
  }
  
  // Check condition checks intent.status
  const statusCondition = firstRule.conditions.find(c => c.field === 'intent.status');
  if (statusCondition) {
    console.log('✅ Condition checks intent.status');
    
    if (statusCondition.op === 'in') {
      console.log('✅ Operator = "in"');
    } else {
      console.log(`❌ Operator = "${statusCondition.op}" (expected: "in")`);
      issues.push('Status condition operator should be "in"');
    }
    
    if (Array.isArray(statusCondition.value) && 
        statusCondition.value.includes('ambiguous') && 
        statusCondition.value.includes('unsafe')) {
      console.log('✅ Value includes ["ambiguous", "unsafe"]');
    } else {
      console.log(`❌ Value = ${JSON.stringify(statusCondition.value)}`);
      issues.push('Status condition should check for ["ambiguous", "unsafe"]');
    }
  } else {
    console.log('❌ No condition checking intent.status');
    issues.push('DENY_IF_INTENT_INVALID should have intent.status condition');
  }
  
  return { passed: issues.length === 0, issues };
});

// TEST 2: RULE TYPES
test(2, 'RULE TYPES VALIDATION', () => {
  console.log('Input: Trade intent with all rules');
  
  const intent = {
    intent_id: 'test-types-001',
    status: 'valid',
    allowed_actions: ['trade'],
    forbidden_actions: [],
    constraints: {
      max_trade_amount: 500,
      allowed_assets: ['AAPL', 'TSLA']
    }
  };
  
  const policy = generatePolicy(intent);
  const issues = [];
  
  console.log(`\nChecking ${policy.rules.length} rules for type field:\n`);
  
  const expectedTypes = {
    'DENY_IF_INTENT_INVALID': 'security',
    'DENY_TRADE_IF_NOT_ALLOWED': 'security',
    'ALLOW_TRADE_WITH_LIMIT': 'constraint',
    'DEFAULT_DENY': 'default'
  };
  
  policy.rules.forEach((rule, index) => {
    console.log(`Rule ${index + 1}: ${rule.id}`);
    
    // Check type field exists
    if (rule.type) {
      console.log(`  ✅ type field exists: "${rule.type}"`);
      
      // Check type value is correct
      const expectedType = expectedTypes[rule.id];
      if (expectedType) {
        if (rule.type === expectedType) {
          console.log(`  ✅ type value correct: "${rule.type}"`);
        } else {
          console.log(`  ❌ type value incorrect: "${rule.type}" (expected: "${expectedType}")`);
          issues.push(`${rule.id} should have type="${expectedType}", got "${rule.type}"`);
        }
      }
    } else {
      console.log(`  ❌ type field MISSING`);
      issues.push(`${rule.id} is missing type field`);
    }
    console.log();
  });
  
  return { passed: issues.length === 0, issues };
});

// TEST 3: EMPTY ASSET EDGE CASE
test(3, 'EMPTY ASSET EDGE CASE', () => {
  console.log('Input: Trade allowed but allowed_assets = []');
  
  const intent = {
    intent_id: 'test-empty-assets-001',
    status: 'valid',
    allowed_actions: ['trade'],
    forbidden_actions: [],
    constraints: {
      max_trade_amount: 1000,
      allowed_assets: []
    }
  };
  
  const policy = generatePolicy(intent);
  const issues = [];
  
  // Check NO ALLOW_TRADE_WITH_LIMIT rule
  const allowRule = policy.rules.find(r => r.id === 'ALLOW_TRADE_WITH_LIMIT');
  
  if (!allowRule) {
    console.log('✅ NO ALLOW_TRADE_WITH_LIMIT rule (correct)');
  } else {
    console.log('❌ ALLOW_TRADE_WITH_LIMIT rule exists (should NOT exist)');
    issues.push('ALLOW_TRADE_WITH_LIMIT should not be generated when allowed_assets is empty');
  }
  
  // Verify other rules still exist
  const denyInvalidRule = policy.rules.find(r => r.id === 'DENY_IF_INTENT_INVALID');
  const denyTradeRule = policy.rules.find(r => r.id === 'DENY_TRADE_IF_NOT_ALLOWED');
  const defaultRule = policy.rules.find(r => r.id === 'DEFAULT_DENY');
  
  if (denyInvalidRule) {
    console.log('✅ DENY_IF_INTENT_INVALID present');
  } else {
    console.log('❌ DENY_IF_INTENT_INVALID missing');
    issues.push('DENY_IF_INTENT_INVALID should always be present');
  }
  
  if (denyTradeRule) {
    console.log('✅ DENY_TRADE_IF_NOT_ALLOWED present');
  } else {
    console.log('❌ DENY_TRADE_IF_NOT_ALLOWED missing');
    issues.push('DENY_TRADE_IF_NOT_ALLOWED should always be present');
  }
  
  if (defaultRule) {
    console.log('✅ DEFAULT_DENY present');
  } else {
    console.log('❌ DEFAULT_DENY missing');
    issues.push('DEFAULT_DENY should always be present');
  }
  
  // Check rule count
  if (policy.rules.length === 3) {
    console.log('✅ Rule count = 3 (DENY_INVALID + DENY_TRADE + DEFAULT)');
  } else {
    console.log(`❌ Rule count = ${policy.rules.length} (expected: 3)`);
    issues.push(`Expected 3 rules, got ${policy.rules.length}`);
  }
  
  return { passed: issues.length === 0, issues };
});

// TEST 4: NORMAL TRADE CASE
test(4, 'NORMAL TRADE CASE (ALL RULES)', () => {
  console.log('Input: Normal trade with assets');
  
  const intent = {
    intent_id: 'test-normal-trade-001',
    status: 'valid',
    allowed_actions: ['trade'],
    forbidden_actions: [],
    constraints: {
      max_trade_amount: 100,
      allowed_assets: ['AAPL']
    }
  };
  
  const policy = generatePolicy(intent);
  const issues = [];
  
  // Check all 4 rules present
  const ruleIds = policy.rules.map(r => r.id);
  
  const expectedRules = [
    'DENY_IF_INTENT_INVALID',
    'DENY_TRADE_IF_NOT_ALLOWED',
    'ALLOW_TRADE_WITH_LIMIT',
    'DEFAULT_DENY'
  ];
  
  console.log('Checking rule presence:\n');
  
  expectedRules.forEach(expectedId => {
    if (ruleIds.includes(expectedId)) {
      console.log(`✅ ${expectedId} present`);
    } else {
      console.log(`❌ ${expectedId} MISSING`);
      issues.push(`${expectedId} should be present`);
    }
  });
  
  // Check order
  console.log('\nChecking rule order:');
  const actualOrder = policy.rules.map(r => r.id).join(' → ');
  const expectedOrder = expectedRules.join(' → ');
  
  console.log(`Expected: ${expectedOrder}`);
  console.log(`Actual:   ${actualOrder}`);
  
  if (actualOrder === expectedOrder) {
    console.log('✅ Order correct');
  } else {
    console.log('❌ Order incorrect');
    issues.push('Rule order does not match expected sequence');
  }
  
  // Check rule count
  if (policy.rules.length === 4) {
    console.log('✅ Rule count = 4');
  } else {
    console.log(`❌ Rule count = ${policy.rules.length} (expected: 4)`);
    issues.push(`Expected 4 rules, got ${policy.rules.length}`);
  }
  
  return { passed: issues.length === 0, issues };
});

// TEST 5: RULE ORDER VERIFICATION
test(5, 'RULE ORDER STRICT VERIFICATION', () => {
  console.log('Input: Multiple scenarios to verify order consistency');
  
  const scenarios = [
    {
      name: 'Analysis Intent',
      intent: {
        intent_id: 'order-test-1',
        status: 'valid',
        allowed_actions: ['read_data'],
        forbidden_actions: ['trade'],
        constraints: { max_trade_amount: 0, allowed_assets: ['NVDA'] }
      },
      expectedOrder: ['DENY_IF_INTENT_INVALID', 'DENY_TRADE_IF_NOT_ALLOWED', 'DEFAULT_DENY']
    },
    {
      name: 'Trade Intent',
      intent: {
        intent_id: 'order-test-2',
        status: 'valid',
        allowed_actions: ['trade'],
        forbidden_actions: [],
        constraints: { max_trade_amount: 200, allowed_assets: ['TSLA'] }
      },
      expectedOrder: ['DENY_IF_INTENT_INVALID', 'DENY_TRADE_IF_NOT_ALLOWED', 'ALLOW_TRADE_WITH_LIMIT', 'DEFAULT_DENY']
    },
    {
      name: 'Unsafe Intent',
      intent: {
        intent_id: 'order-test-3',
        status: 'unsafe',
        allowed_actions: [],
        forbidden_actions: ['trade'],
        constraints: { max_trade_amount: 0, allowed_assets: [] }
      },
      expectedOrder: ['DENY_IF_INTENT_INVALID', 'DENY_TRADE_IF_NOT_ALLOWED', 'DEFAULT_DENY']
    }
  ];
  
  const issues = [];
  
  scenarios.forEach((scenario, index) => {
    console.log(`\nScenario ${index + 1}: ${scenario.name}`);
    
    const policy = generatePolicy(scenario.intent);
    const actualOrder = policy.rules.map(r => r.id);
    
    console.log(`  Expected: ${scenario.expectedOrder.join(' → ')}`);
    console.log(`  Actual:   ${actualOrder.join(' → ')}`);
    
    // Check if orders match
    const ordersMatch = actualOrder.length === scenario.expectedOrder.length &&
                        actualOrder.every((id, idx) => id === scenario.expectedOrder[idx]);
    
    if (ordersMatch) {
      console.log('  ✅ Order correct');
    } else {
      console.log('  ❌ Order incorrect');
      issues.push(`${scenario.name}: Order mismatch`);
    }
    
    // Verify DENY_IF_INTENT_INVALID is always first
    if (actualOrder[0] === 'DENY_IF_INTENT_INVALID') {
      console.log('  ✅ DENY_IF_INTENT_INVALID is first');
    } else {
      console.log(`  ❌ First rule is ${actualOrder[0]} (should be DENY_IF_INTENT_INVALID)`);
      issues.push(`${scenario.name}: DENY_IF_INTENT_INVALID not first`);
    }
    
    // Verify DEFAULT_DENY is always last
    if (actualOrder[actualOrder.length - 1] === 'DEFAULT_DENY') {
      console.log('  ✅ DEFAULT_DENY is last');
    } else {
      console.log(`  ❌ Last rule is ${actualOrder[actualOrder.length - 1]} (should be DEFAULT_DENY)`);
      issues.push(`${scenario.name}: DEFAULT_DENY not last`);
    }
  });
  
  return { passed: issues.length === 0, issues };
});

// TEST 6: REGRESSION - RUN PREVIOUS TESTS
test(6, 'REGRESSION - PREVIOUS QA TESTS', () => {
  console.log('Re-running previous QA test scenarios');
  
  const issues = [];
  
  // Previous Test 1: Analysis Intent
  console.log('\n[Regression 1] Analysis Intent:');
  const intent1 = {
    intent_id: 'regression-1',
    status: 'valid',
    allowed_actions: ['read_data'],
    forbidden_actions: ['trade'],
    constraints: { max_trade_amount: 0, allowed_assets: ['NVDA'] }
  };
  const policy1 = generatePolicy(intent1);
  
  if (policy1.rules.find(r => r.id === 'DENY_TRADE_IF_NOT_ALLOWED')) {
    console.log('  ✅ DENY_TRADE_IF_NOT_ALLOWED exists');
  } else {
    console.log('  ❌ DENY_TRADE_IF_NOT_ALLOWED missing');
    issues.push('Regression 1: DENY_TRADE_IF_NOT_ALLOWED missing');
  }
  
  if (!policy1.rules.find(r => r.id === 'ALLOW_TRADE_WITH_LIMIT')) {
    console.log('  ✅ NO ALLOW_TRADE_WITH_LIMIT');
  } else {
    console.log('  ❌ ALLOW_TRADE_WITH_LIMIT should not exist');
    issues.push('Regression 1: ALLOW_TRADE_WITH_LIMIT should not exist');
  }
  
  if (policy1.rules.length === 3) {
    console.log('  ✅ Rule count = 3');
  } else {
    console.log(`  ❌ Rule count = ${policy1.rules.length} (expected: 3)`);
    issues.push(`Regression 1: Expected 3 rules, got ${policy1.rules.length}`);
  }
  
  // Previous Test 2: Trade Intent
  console.log('\n[Regression 2] Trade Intent:');
  const intent2 = {
    intent_id: 'regression-2',
    status: 'valid',
    allowed_actions: ['trade'],
    forbidden_actions: [],
    constraints: { max_trade_amount: 100, allowed_assets: ['AAPL'] }
  };
  const policy2 = generatePolicy(intent2);
  
  if (policy2.rules.length === 4) {
    console.log('  ✅ Rule count = 4');
  } else {
    console.log(`  ❌ Rule count = ${policy2.rules.length} (expected: 4)`);
    issues.push(`Regression 2: Expected 4 rules, got ${policy2.rules.length}`);
  }
  
  // Previous Test 3: Rule Structure
  console.log('\n[Regression 3] Rule Structure:');
  let structureValid = true;
  policy2.rules.forEach(rule => {
    if (!rule.id || !rule.description || !rule.action || !rule.effect || !Array.isArray(rule.conditions)) {
      structureValid = false;
    }
  });
  
  if (structureValid) {
    console.log('  ✅ All rules have valid structure');
  } else {
    console.log('  ❌ Some rules have invalid structure');
    issues.push('Regression 3: Rule structure validation failed');
  }
  
  // Previous Test 4: Metadata
  console.log('\n[Regression 4] Policy Metadata:');
  if (policy2.policy_id && policy2.intent_id === intent2.intent_id && 
      policy2.policy_version === 'v1' && policy2.generated_at) {
    console.log('  ✅ Metadata valid');
  } else {
    console.log('  ❌ Metadata invalid');
    issues.push('Regression 4: Metadata validation failed');
  }
  
  // Previous Test 5: value_from
  console.log('\n[Regression 5] value_from Validation:');
  const allowRule = policy2.rules.find(r => r.id === 'ALLOW_TRADE_WITH_LIMIT');
  if (allowRule) {
    const assetCond = allowRule.conditions.find(c => c.field === 'action.asset');
    const amountCond = allowRule.conditions.find(c => c.field === 'action.amount');
    
    if (assetCond?.value_from === 'intent.constraints.allowed_assets' &&
        amountCond?.value_from === 'intent.constraints.max_trade_amount') {
      console.log('  ✅ value_from fields correct');
    } else {
      console.log('  ❌ value_from fields incorrect');
      issues.push('Regression 5: value_from validation failed');
    }
  } else {
    console.log('  ❌ ALLOW rule not found');
    issues.push('Regression 5: ALLOW rule not found');
  }
  
  // Previous Test 6: Edge Case
  console.log('\n[Regression 6] Edge Case - Empty allowed_actions:');
  const intent6 = {
    intent_id: 'regression-6',
    status: 'valid',
    allowed_actions: [],
    forbidden_actions: ['trade'],
    constraints: { max_trade_amount: 0, allowed_assets: [] }
  };
  const policy6 = generatePolicy(intent6);
  
  if (policy6.rules.length === 3 && !policy6.rules.find(r => r.id === 'ALLOW_TRADE_WITH_LIMIT')) {
    console.log('  ✅ Edge case handled correctly');
  } else {
    console.log('  ❌ Edge case not handled correctly');
    issues.push('Regression 6: Edge case validation failed');
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
  console.log('🎉 ALL TESTS PASSED! Updated module validated successfully.\n');
} else {
  console.log('⚠️  SOME TESTS FAILED. Review failures above.\n');
  process.exit(1);
}
