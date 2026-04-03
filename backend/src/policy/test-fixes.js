const { generatePolicy } = require('./generatePolicy');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       POLICY GENERATION - FIXES VALIDATION                 ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

let passCount = 0;
let failCount = 0;

function test(testName, testFn) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(testName);
  console.log('═'.repeat(60));
  
  const result = testFn();
  if (result.passed) {
    console.log('✅ PASS\n');
    passCount++;
  } else {
    console.log('❌ FAIL');
    result.issues.forEach(issue => console.log(`  - ${issue}`));
    console.log();
    failCount++;
  }
}

// FIX 1: DENY_IF_INTENT_INVALID at top
test('FIX 1: DENY_IF_INTENT_INVALID Rule at Top', () => {
  const intent = {
    intent_id: 'test-1',
    status: 'unsafe',
    allowed_actions: ['trade'],
    constraints: { max_trade_amount: 100, allowed_assets: ['AAPL'] }
  };
  
  const policy = generatePolicy(intent);
  const issues = [];
  
  // Check rule exists
  const rule = policy.rules.find(r => r.id === 'DENY_IF_INTENT_INVALID');
  if (!rule) {
    issues.push('DENY_IF_INTENT_INVALID rule not found');
    return { passed: false, issues };
  }
  
  console.log('✓ DENY_IF_INTENT_INVALID rule exists');
  
  // Check it's at position 0
  if (policy.rules[0].id === 'DENY_IF_INTENT_INVALID') {
    console.log('✓ Rule is at position 0 (top priority)');
  } else {
    issues.push(`Rule at position ${policy.rules.findIndex(r => r.id === 'DENY_IF_INTENT_INVALID')}, expected 0`);
  }
  
  // Check structure
  if (rule.action === 'any') console.log('✓ action = "any"');
  else issues.push('action should be "any"');
  
  if (rule.effect === 'deny') console.log('✓ effect = "deny"');
  else issues.push('effect should be "deny"');
  
  // Check condition
  const cond = rule.conditions[0];
  if (cond.field === 'intent.status') console.log('✓ condition field = "intent.status"');
  else issues.push('condition field should be "intent.status"');
  
  if (cond.op === 'in') console.log('✓ condition op = "in"');
  else issues.push('condition op should be "in"');
  
  if (JSON.stringify(cond.value) === JSON.stringify(['ambiguous', 'unsafe'])) {
    console.log('✓ condition value = ["ambiguous", "unsafe"]');
  } else {
    issues.push('condition value should be ["ambiguous", "unsafe"]');
  }
  
  return { passed: issues.length === 0, issues };
});

// FIX 2: Type field added to all rules
test('FIX 2: Type Field Added to All Rules', () => {
  const intent = {
    intent_id: 'test-2',
    status: 'valid',
    allowed_actions: ['trade'],
    constraints: { max_trade_amount: 100, allowed_assets: ['AAPL'] }
  };
  
  const policy = generatePolicy(intent);
  const issues = [];
  
  const expectedTypes = {
    'DENY_IF_INTENT_INVALID': 'security',
    'DENY_TRADE_IF_NOT_ALLOWED': 'security',
    'ALLOW_TRADE_WITH_LIMIT': 'constraint',
    'DEFAULT_DENY': 'default'
  };
  
  policy.rules.forEach(rule => {
    if (!rule.type) {
      issues.push(`Rule ${rule.id} missing type field`);
    } else if (expectedTypes[rule.id] && rule.type !== expectedTypes[rule.id]) {
      issues.push(`Rule ${rule.id} has type "${rule.type}", expected "${expectedTypes[rule.id]}"`);
    } else {
      console.log(`✓ ${rule.id}: type = "${rule.type}"`);
    }
  });
  
  return { passed: issues.length === 0, issues };
});

// FIX 3: ALLOW rule only if assets exist
test('FIX 3: ALLOW Rule Only if Assets Exist', () => {
  const issues = [];
  
  // Test with empty assets
  console.log('\nTest A: Empty allowed_assets');
  const intent1 = {
    intent_id: 'test-3a',
    status: 'valid',
    allowed_actions: ['trade'],
    constraints: { max_trade_amount: 100, allowed_assets: [] }
  };
  
  const policy1 = generatePolicy(intent1);
  const allowRule1 = policy1.rules.find(r => r.id === 'ALLOW_TRADE_WITH_LIMIT');
  
  if (!allowRule1) {
    console.log('  ✓ NO ALLOW rule (correct for empty assets)');
  } else {
    issues.push('ALLOW rule should NOT exist when allowed_assets is empty');
  }
  
  // Test with assets
  console.log('\nTest B: With allowed_assets');
  const intent2 = {
    intent_id: 'test-3b',
    status: 'valid',
    allowed_actions: ['trade'],
    constraints: { max_trade_amount: 100, allowed_assets: ['AAPL'] }
  };
  
  const policy2 = generatePolicy(intent2);
  const allowRule2 = policy2.rules.find(r => r.id === 'ALLOW_TRADE_WITH_LIMIT');
  
  if (allowRule2) {
    console.log('  ✓ ALLOW rule exists (correct with assets)');
  } else {
    issues.push('ALLOW rule should exist when allowed_assets has items');
  }
  
  return { passed: issues.length === 0, issues };
});

// FIX 4: Rule order preserved
test('FIX 4: Rule Order Preserved', () => {
  const intent = {
    intent_id: 'test-4',
    status: 'valid',
    allowed_actions: ['trade'],
    constraints: { max_trade_amount: 100, allowed_assets: ['AAPL'] }
  };
  
  const policy = generatePolicy(intent);
  const issues = [];
  
  const expectedOrder = [
    'DENY_IF_INTENT_INVALID',
    'DENY_TRADE_IF_NOT_ALLOWED',
    'ALLOW_TRADE_WITH_LIMIT',
    'DEFAULT_DENY'
  ];
  
  console.log('Expected order:');
  expectedOrder.forEach((id, i) => console.log(`  ${i + 1}. ${id}`));
  
  console.log('\nActual order:');
  policy.rules.forEach((rule, i) => {
    console.log(`  ${i + 1}. ${rule.id}`);
    if (rule.id !== expectedOrder[i]) {
      issues.push(`Position ${i + 1}: expected ${expectedOrder[i]}, got ${rule.id}`);
    }
  });
  
  if (issues.length === 0) {
    console.log('\n✓ Rule order is correct');
  }
  
  return { passed: issues.length === 0, issues };
});

// Display final rules array example
console.log('\n\n╔════════════════════════════════════════════════════════════╗');
console.log('║              FINAL RULES ARRAY EXAMPLE                     ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const exampleIntent = {
  intent_id: 'example-001',
  status: 'valid',
  allowed_actions: ['trade'],
  constraints: { max_trade_amount: 500, allowed_assets: ['AAPL', 'TSLA'] }
};

const examplePolicy = generatePolicy(exampleIntent);
console.log(JSON.stringify(examplePolicy.rules, null, 2));

// Summary
console.log('\n\n╔════════════════════════════════════════════════════════════╗');
console.log('║                  FIXES VALIDATION SUMMARY                  ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log(`\nTotal Tests: ${passCount + failCount}`);
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%\n`);

if (failCount === 0) {
  console.log('🎉 ALL FIXES VALIDATED!\n');
} else {
  console.log('⚠️  SOME FIXES FAILED.\n');
  process.exit(1);
}
