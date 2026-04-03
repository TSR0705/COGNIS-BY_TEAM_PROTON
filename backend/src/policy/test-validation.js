const { generatePolicy } = require('./generatePolicy');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       POLICY VALIDATION TEST                               ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

let passCount = 0;
let failCount = 0;

function validate(testName, intent, expectations) {
  console.log(`\nTest: ${testName}`);
  console.log('─'.repeat(60));
  
  const policy = generatePolicy(intent);
  let allPassed = true;
  
  for (const [key, expected] of Object.entries(expectations)) {
    let actual;
    
    if (key === 'rule_count') {
      actual = policy.rules.length;
    } else if (key === 'has_allow_rule') {
      actual = policy.rules.some(r => r.id === 'ALLOW_TRADE_WITH_LIMIT');
    } else if (key === 'first_rule_id') {
      actual = policy.rules[0].id;
    } else if (key === 'last_rule_id') {
      actual = policy.rules[policy.rules.length - 1].id;
    } else if (key === 'strategy') {
      actual = policy.evaluation.strategy;
    } else if (key === 'default') {
      actual = policy.evaluation.default;
    } else if (key === 'policy_version') {
      actual = policy.policy_version;
    }
    
    const passed = actual === expected;
    console.log(`${passed ? '✅' : '❌'} ${key}: ${actual} ${!passed ? `(expected: ${expected})` : ''}`);
    
    if (!passed) allPassed = false;
  }
  
  if (allPassed) {
    console.log('Result: ✅ PASS');
    passCount++;
  } else {
    console.log('Result: ❌ FAIL');
    failCount++;
  }
}

// Test 1: Trade Intent
validate('Trade Intent - 3 Rules', {
  intent_id: 'test-1',
  allowed_actions: ['trade'],
  constraints: { max_trade_amount: 100, allowed_assets: ['AAPL'] }
}, {
  rule_count: 3,
  has_allow_rule: true,
  first_rule_id: 'DENY_TRADE_IF_NOT_ALLOWED',
  last_rule_id: 'DEFAULT_DENY',
  strategy: 'deny-overrides',
  default: 'deny',
  policy_version: 'v1'
});

// Test 2: Analysis Intent
validate('Analysis Intent - 2 Rules', {
  intent_id: 'test-2',
  allowed_actions: ['read_data'],
  constraints: { max_trade_amount: 0, allowed_assets: [] }
}, {
  rule_count: 2,
  has_allow_rule: false,
  first_rule_id: 'DENY_TRADE_IF_NOT_ALLOWED',
  last_rule_id: 'DEFAULT_DENY',
  strategy: 'deny-overrides',
  default: 'deny'
});

// Test 3: Monitor Intent
validate('Monitor Intent - 2 Rules', {
  intent_id: 'test-3',
  allowed_actions: ['read_data', 'subscribe'],
  constraints: { max_trade_amount: 0, allowed_assets: ['NVDA'] }
}, {
  rule_count: 2,
  has_allow_rule: false,
  first_rule_id: 'DENY_TRADE_IF_NOT_ALLOWED',
  last_rule_id: 'DEFAULT_DENY'
});

// Test 4: Unknown Intent
validate('Unknown Intent - 2 Rules', {
  intent_id: 'test-4',
  allowed_actions: [],
  constraints: { max_trade_amount: 0, allowed_assets: [] }
}, {
  rule_count: 2,
  has_allow_rule: false,
  strategy: 'deny-overrides',
  default: 'deny'
});

console.log('\n\n╔════════════════════════════════════════════════════════════╗');
console.log('║                  VALIDATION SUMMARY                        ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log(`\nTotal Tests: ${passCount + failCount}`);
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%\n`);

if (failCount === 0) {
  console.log('🎉 ALL VALIDATION TESTS PASSED!\n');
} else {
  console.log('⚠️  SOME TESTS FAILED.\n');
  process.exit(1);
}
