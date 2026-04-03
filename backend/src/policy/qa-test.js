const { generatePolicy } = require('./generatePolicy');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       POLICY GENERATION MODULE - QA TEST SUITE             ║');
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

// TEST 1: ANALYSIS INTENT
test(1, 'ANALYSIS INTENT', () => {
  console.log('Input: Analysis intent (trade NOT allowed)');
  
  const intent = {
    intent_id: 'test-analysis-001',
    allowed_actions: ['read_data'],
    forbidden_actions: ['trade'],
    constraints: {
      max_trade_amount: 0,
      allowed_assets: ['NVDA']
    }
  };
  
  const policy = generatePolicy(intent);
  const issues = [];
  
  // Check DENY_TRADE_IF_NOT_ALLOWED exists
  const denyRule = policy.rules.find(r => r.id === 'DENY_TRADE_IF_NOT_ALLOWED');
  if (denyRule) {
    console.log('✅ DENY_TRADE_IF_NOT_ALLOWED exists');
  } else {
    console.log('❌ DENY_TRADE_IF_NOT_ALLOWED missing');
    issues.push('DENY_TRADE_IF_NOT_ALLOWED rule not found');
  }
  
  // Check NO ALLOW_TRADE_WITH_LIMIT
  const allowRule = policy.rules.find(r => r.id === 'ALLOW_TRADE_WITH_LIMIT');
  if (!allowRule) {
    console.log('✅ NO ALLOW_TRADE_WITH_LIMIT (correct)');
  } else {
    console.log('❌ ALLOW_TRADE_WITH_LIMIT should NOT exist');
    issues.push('ALLOW_TRADE_WITH_LIMIT should not be generated for analysis intent');
  }
  
  // Check DEFAULT_DENY exists
  const defaultRule = policy.rules.find(r => r.id === 'DEFAULT_DENY');
  if (defaultRule) {
    console.log('✅ DEFAULT_DENY exists');
  } else {
    console.log('❌ DEFAULT_DENY missing');
    issues.push('DEFAULT_DENY rule not found');
  }
  
  // Check rule count
  if (policy.rules.length === 3) {
    console.log('✅ Rule count: 3 (correct - includes DENY_IF_INTENT_INVALID)');
  } else {
    console.log(`❌ Rule count: ${policy.rules.length} (expected: 3)`);
    issues.push(`Expected 3 rules, got ${policy.rules.length}`);
  }
  
  return { passed: issues.length === 0, issues };
});

// TEST 2: TRADE INTENT
test(2, 'TRADE INTENT', () => {
  console.log('Input: Trade intent (trade allowed)');
  
  const intent = {
    intent_id: 'test-trade-001',
    allowed_actions: ['trade'],
    forbidden_actions: [],
    constraints: {
      max_trade_amount: 100,
      allowed_assets: ['AAPL']
    }
  };
  
  const policy = generatePolicy(intent);
  const issues = [];
  
  // Check DENY_TRADE_IF_NOT_ALLOWED exists
  const denyRule = policy.rules.find(r => r.id === 'DENY_TRADE_IF_NOT_ALLOWED');
  if (denyRule) {
    console.log('✅ DENY_TRADE_IF_NOT_ALLOWED exists');
  } else {
    console.log('❌ DENY_TRADE_IF_NOT_ALLOWED missing');
    issues.push('DENY_TRADE_IF_NOT_ALLOWED rule not found');
  }
  
  // Check ALLOW_TRADE_WITH_LIMIT exists
  const allowRule = policy.rules.find(r => r.id === 'ALLOW_TRADE_WITH_LIMIT');
  if (allowRule) {
    console.log('✅ ALLOW_TRADE_WITH_LIMIT exists');
  } else {
    console.log('❌ ALLOW_TRADE_WITH_LIMIT missing');
    issues.push('ALLOW_TRADE_WITH_LIMIT rule not found');
  }
  
  // Check DEFAULT_DENY exists
  const defaultRule = policy.rules.find(r => r.id === 'DEFAULT_DENY');
  if (defaultRule) {
    console.log('✅ DEFAULT_DENY exists');
  } else {
    console.log('❌ DEFAULT_DENY missing');
    issues.push('DEFAULT_DENY rule not found');
  }
  
  // Check rule order
  if (policy.rules[0].id === 'DENY_IF_INTENT_INVALID' &&
      policy.rules[1].id === 'DENY_TRADE_IF_NOT_ALLOWED' &&
      policy.rules[2].id === 'ALLOW_TRADE_WITH_LIMIT' &&
      policy.rules[3].id === 'DEFAULT_DENY') {
    console.log('✅ Rule order correct: DENY_INVALID → DENY_TRADE → ALLOW → DEFAULT');
  } else {
    console.log('❌ Rule order incorrect');
    console.log(`   Actual: ${policy.rules.map(r => r.id).join(' → ')}`);
    issues.push('Rule order is incorrect');
  }
  
  // Check rule count
  if (policy.rules.length === 4) {
    console.log('✅ Rule count: 4 (correct - includes DENY_IF_INTENT_INVALID)');
  } else {
    console.log(`❌ Rule count: ${policy.rules.length} (expected: 4)`);
    issues.push(`Expected 4 rules, got ${policy.rules.length}`);
  }
  
  return { passed: issues.length === 0, issues };
});


// TEST 3: RULE STRUCTURE
test(3, 'RULE STRUCTURE', () => {
  console.log('Input: Validate rule structure for all rules');
  
  const intent = {
    intent_id: 'test-structure-001',
    allowed_actions: ['trade'],
    constraints: {
      max_trade_amount: 500,
      allowed_assets: ['TSLA', 'NVDA']
    }
  };
  
  const policy = generatePolicy(intent);
  const issues = [];
  
  policy.rules.forEach((rule, index) => {
    console.log(`\nChecking Rule ${index + 1}: ${rule.id}`);
    
    // Check id
    if (rule.id && typeof rule.id === 'string') {
      console.log('  ✅ id present and valid');
    } else {
      console.log('  ❌ id missing or invalid');
      issues.push(`Rule ${index + 1}: id missing or invalid`);
    }
    
    // Check description
    if (rule.description && typeof rule.description === 'string') {
      console.log('  ✅ description present and valid');
    } else {
      console.log('  ❌ description missing or invalid');
      issues.push(`Rule ${index + 1}: description missing or invalid`);
    }
    
    // Check action
    if (rule.action && typeof rule.action === 'string') {
      console.log('  ✅ action present and valid');
    } else {
      console.log('  ❌ action missing or invalid');
      issues.push(`Rule ${index + 1}: action missing or invalid`);
    }
    
    // Check effect
    if (rule.effect === 'allow' || rule.effect === 'deny') {
      console.log(`  ✅ effect valid: "${rule.effect}"`);
    } else {
      console.log(`  ❌ effect invalid: "${rule.effect}"`);
      issues.push(`Rule ${index + 1}: effect must be "allow" or "deny"`);
    }
    
    // Check conditions
    if (Array.isArray(rule.conditions)) {
      console.log(`  ✅ conditions is array (${rule.conditions.length} conditions)`);
      
      // Validate each condition
      rule.conditions.forEach((cond, condIndex) => {
        if (!cond.field) {
          issues.push(`Rule ${index + 1}, Condition ${condIndex + 1}: field missing`);
        }
        if (!cond.op) {
          issues.push(`Rule ${index + 1}, Condition ${condIndex + 1}: op missing`);
        }
        if (!cond.value && !cond.value_from) {
          issues.push(`Rule ${index + 1}, Condition ${condIndex + 1}: neither value nor value_from present`);
        }
      });
    } else {
      console.log('  ❌ conditions is not an array');
      issues.push(`Rule ${index + 1}: conditions must be an array`);
    }
  });
  
  return { passed: issues.length === 0, issues };
});

// TEST 4: POLICY METADATA
test(4, 'POLICY METADATA', () => {
  console.log('Input: Validate policy metadata fields');
  
  const intent = {
    intent_id: 'test-metadata-001',
    allowed_actions: ['read_data'],
    constraints: {
      max_trade_amount: 0,
      allowed_assets: []
    }
  };
  
  const policy = generatePolicy(intent);
  const issues = [];
  
  // Check policy_id
  if (policy.policy_id && typeof policy.policy_id === 'string') {
    console.log(`✅ policy_id exists: ${policy.policy_id}`);
  } else {
    console.log('❌ policy_id missing or invalid');
    issues.push('policy_id missing or invalid');
  }
  
  // Check intent_id copied
  if (policy.intent_id === intent.intent_id) {
    console.log(`✅ intent_id copied correctly: ${policy.intent_id}`);
  } else {
    console.log(`❌ intent_id mismatch: ${policy.intent_id} vs ${intent.intent_id}`);
    issues.push('intent_id not copied correctly');
  }
  
  // Check policy_version
  if (policy.policy_version === 'v1') {
    console.log('✅ policy_version = "v1"');
  } else {
    console.log(`❌ policy_version = "${policy.policy_version}" (expected: "v1")`);
    issues.push('policy_version must be "v1"');
  }
  
  // Check generated_at
  if (policy.generated_at && typeof policy.generated_at === 'string') {
    // Validate ISO format
    const date = new Date(policy.generated_at);
    if (!isNaN(date.getTime())) {
      console.log(`✅ generated_at exists and valid: ${policy.generated_at}`);
    } else {
      console.log('❌ generated_at is not valid ISO timestamp');
      issues.push('generated_at is not valid ISO timestamp');
    }
  } else {
    console.log('❌ generated_at missing or invalid');
    issues.push('generated_at missing or invalid');
  }
  
  // Check evaluation
  if (policy.evaluation) {
    if (policy.evaluation.strategy === 'deny-overrides') {
      console.log('✅ evaluation.strategy = "deny-overrides"');
    } else {
      console.log(`❌ evaluation.strategy = "${policy.evaluation.strategy}"`);
      issues.push('evaluation.strategy must be "deny-overrides"');
    }
    
    if (policy.evaluation.default === 'deny') {
      console.log('✅ evaluation.default = "deny"');
    } else {
      console.log(`❌ evaluation.default = "${policy.evaluation.default}"`);
      issues.push('evaluation.default must be "deny"');
    }
  } else {
    console.log('❌ evaluation object missing');
    issues.push('evaluation object missing');
  }
  
  return { passed: issues.length === 0, issues };
});


// TEST 5: VALUE_FROM VALIDATION
test(5, 'VALUE_FROM VALIDATION', () => {
  console.log('Input: Validate value_from fields in ALLOW rule');
  
  const intent = {
    intent_id: 'test-valuefrom-001',
    allowed_actions: ['trade'],
    constraints: {
      max_trade_amount: 250,
      allowed_assets: ['AAPL', 'MSFT']
    }
  };
  
  const policy = generatePolicy(intent);
  const issues = [];
  
  const allowRule = policy.rules.find(r => r.id === 'ALLOW_TRADE_WITH_LIMIT');
  
  if (!allowRule) {
    console.log('❌ ALLOW_TRADE_WITH_LIMIT rule not found');
    issues.push('ALLOW_TRADE_WITH_LIMIT rule not found');
    return { passed: false, issues };
  }
  
  console.log('Checking ALLOW_TRADE_WITH_LIMIT conditions:');
  
  // Check asset condition
  const assetCondition = allowRule.conditions.find(c => c.field === 'action.asset');
  if (assetCondition) {
    console.log('  ✅ Asset condition found');
    
    if (assetCondition.op === 'in') {
      console.log('  ✅ Asset operator: "in"');
    } else {
      console.log(`  ❌ Asset operator: "${assetCondition.op}" (expected: "in")`);
      issues.push('Asset condition operator should be "in"');
    }
    
    if (assetCondition.value_from === 'intent.constraints.allowed_assets') {
      console.log('  ✅ Asset value_from: "intent.constraints.allowed_assets"');
    } else {
      console.log(`  ❌ Asset value_from: "${assetCondition.value_from}"`);
      issues.push('Asset condition should use value_from, not hardcoded value');
    }
    
    if (assetCondition.value !== undefined) {
      console.log('  ❌ Asset condition has hardcoded value (should use value_from)');
      issues.push('Asset condition should not have hardcoded value');
    } else {
      console.log('  ✅ No hardcoded asset value');
    }
  } else {
    console.log('  ❌ Asset condition not found');
    issues.push('Asset condition not found in ALLOW rule');
  }
  
  // Check amount condition
  const amountCondition = allowRule.conditions.find(c => c.field === 'action.amount');
  if (amountCondition) {
    console.log('  ✅ Amount condition found');
    
    if (amountCondition.op === '<=') {
      console.log('  ✅ Amount operator: "<="');
    } else {
      console.log(`  ❌ Amount operator: "${amountCondition.op}" (expected: "<=")`);
      issues.push('Amount condition operator should be "<="');
    }
    
    if (amountCondition.value_from === 'intent.constraints.max_trade_amount') {
      console.log('  ✅ Amount value_from: "intent.constraints.max_trade_amount"');
    } else {
      console.log(`  ❌ Amount value_from: "${amountCondition.value_from}"`);
      issues.push('Amount condition should use value_from, not hardcoded value');
    }
    
    if (amountCondition.value !== undefined) {
      console.log('  ❌ Amount condition has hardcoded value (should use value_from)');
      issues.push('Amount condition should not have hardcoded value');
    } else {
      console.log('  ✅ No hardcoded amount value');
    }
  } else {
    console.log('  ❌ Amount condition not found');
    issues.push('Amount condition not found in ALLOW rule');
  }
  
  return { passed: issues.length === 0, issues };
});

// TEST 6: EDGE CASE - EMPTY ALLOWED_ACTIONS
test(6, 'EDGE CASE - EMPTY ALLOWED_ACTIONS', () => {
  console.log('Input: Empty allowed_actions array');
  
  const intent = {
    intent_id: 'test-edge-001',
    allowed_actions: [],
    forbidden_actions: ['trade'],
    constraints: {
      max_trade_amount: 0,
      allowed_assets: []
    }
  };
  
  const policy = generatePolicy(intent);
  const issues = [];
  
  // Check DENY rule still present
  const denyRule = policy.rules.find(r => r.id === 'DENY_TRADE_IF_NOT_ALLOWED');
  if (denyRule) {
    console.log('✅ DENY_TRADE_IF_NOT_ALLOWED still present');
  } else {
    console.log('❌ DENY_TRADE_IF_NOT_ALLOWED missing');
    issues.push('DENY rule should always be present');
  }
  
  // Check DEFAULT_DENY present
  const defaultRule = policy.rules.find(r => r.id === 'DEFAULT_DENY');
  if (defaultRule) {
    console.log('✅ DEFAULT_DENY present');
  } else {
    console.log('❌ DEFAULT_DENY missing');
    issues.push('DEFAULT_DENY should always be present');
  }
  
  // Check NO allow rule
  const allowRule = policy.rules.find(r => r.id === 'ALLOW_TRADE_WITH_LIMIT');
  if (!allowRule) {
    console.log('✅ NO ALLOW rule (correct for empty allowed_actions)');
  } else {
    console.log('❌ ALLOW rule should NOT exist');
    issues.push('ALLOW rule should not be generated when trade not allowed');
  }
  
  // Check rule count
  if (policy.rules.length === 3) {
    console.log('✅ Rule count: 3 (DENY_INVALID + DENY_TRADE + DEFAULT)');
  } else {
    console.log(`❌ Rule count: ${policy.rules.length} (expected: 3)`);
    issues.push(`Expected 3 rules, got ${policy.rules.length}`);
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
  console.log('🎉 ALL TESTS PASSED! Module is production-ready.\n');
} else {
  console.log('⚠️  SOME TESTS FAILED. Review failures above.\n');
  process.exit(1);
}
