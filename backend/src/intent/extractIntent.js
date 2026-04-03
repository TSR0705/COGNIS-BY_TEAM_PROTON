const { v4: uuidv4 } = require('uuid');
const config = require('../config/configLoader');

/**
 * Extract structured intent from user input
 * @param {string} userInput - Raw user input string
 * @returns {Object} Structured intent object
 */
function extractIntent(userInput) {
  // Load configurations
  const constraints = config.getConstraints();
  const stockMappings = config.getStockMappings();
  const securityPatterns = config.getSecurityPatterns();

  const SYSTEM_MAX_AMOUNT = constraints.system.max_trade_amount;
  const stockMap = stockMappings.stock_name_to_ticker;
  // ArmorClaw handles injection patterns now, backend only uses question patterns
  const questionPatterns = securityPatterns.question_patterns.map(p => new RegExp(p, 'i'));
  const intentKeywords = securityPatterns.intent_keywords;

  // A. Normalize Input
  const normalized = userInput.toLowerCase().trim();
  
  // Initialize intent object
  const intent = {
    intent_id: uuidv4(),
    raw_input: userInput,
    normalized_input: normalized,
    intent_type: 'unknown',
    scope: [],
    allowed_actions: [],
    forbidden_actions: [],
    constraints: {
      max_trade_amount: 0,
      allowed_assets: []
    },
    signals: {
      prompt_injection: false,
      ambiguity: false
    },
    status: 'valid',
    fail_closed: false
  };

  // B. Detect Intent Type
  const isQuestion = questionPatterns.some(pattern => pattern.test(normalized));
  
  if (isQuestion) {
    intent.intent_type = 'analysis';
  } else if (intentKeywords.trade.some(keyword => new RegExp(`\\b${keyword}\\b`).test(normalized))) {
    intent.intent_type = 'trade';
  } else if (intentKeywords.analysis.some(keyword => new RegExp(`\\b${keyword}\\b`).test(normalized))) {
    intent.intent_type = 'analysis';
  } else if (intentKeywords.monitor.some(keyword => new RegExp(`\\b${keyword}\\b`).test(normalized))) {
    intent.intent_type = 'monitor';
  } else {
    intent.intent_type = 'unknown';
  }
  
  // Detect conflicting intents
  const hasAnalysisKeywords = intentKeywords.analysis.some(k => new RegExp(`\\b${k}\\b`).test(normalized));
  const hasTradeKeywords = intentKeywords.trade.some(k => new RegExp(`\\b${k}\\b`).test(normalized));
  if (hasAnalysisKeywords && hasTradeKeywords) {
    intent.signals.ambiguity = true;
  }

  // C. Extract Asset (uppercase stock tickers)
  const tickerRegex = new RegExp(stockMappings.ticker_regex, 'g');
  const tickers = userInput.match(tickerRegex) || [];
  
  // Filter out stock names that will be mapped
  const stockNameValues = Object.keys(stockMap).map(k => k.toUpperCase());
  
  // Filter out action keywords that might be typed in ALL CAPS (e.g., 'BUY')
  const allKeywords = [
    ...intentKeywords.trade,
    ...intentKeywords.analysis,
    ...intentKeywords.monitor
  ].map(k => k.toUpperCase());

  const filteredTickers = tickers.filter(t => {
    const upperT = t.toUpperCase();
    return !stockNameValues.includes(upperT) && !allKeywords.includes(upperT);
  });
  
  intent.scope = [...new Set(filteredTickers)];
  
  // Add mapped stock names to scope
  for (const [name, ticker] of Object.entries(stockMap)) {
    const wordBoundaryRegex = new RegExp(`\\b${name}\\b`);
    if (wordBoundaryRegex.test(normalized) && !intent.scope.includes(ticker)) {
      intent.scope.push(ticker);
    }
  }
  
  // Ensure all scope items are uppercase and unique
  intent.scope = [...new Set(intent.scope.map(t => t.toUpperCase()))];
  
  // Handle multiple assets
  if (intent.scope.length > 1) {
    intent.signals.ambiguity = true;
  }

  // D. Detect Amount
  let extractedAmount = 0;
  const allAmounts = [];
  
  // Check for k/m suffix first
  const suffixRegex = new RegExp(securityPatterns.amount_patterns.with_suffix, 'gi');
  const suffixMatches = normalized.matchAll(suffixRegex);
  
  for (const match of suffixMatches) {
    const baseAmount = parseFloat(match[1]);
    const suffix = match[2].toLowerCase();
    if (suffix === 'k') {
      allAmounts.push(baseAmount * 1000);
    } else if (suffix === 'm') {
      allAmounts.push(baseAmount * 1000000);
    }
  }
  
  // Standard amount detection
  if (allAmounts.length === 0) {
    const amountRegex = new RegExp(securityPatterns.amount_patterns.standard, 'g');
    const amounts = normalized.match(amountRegex);
    if (amounts && amounts.length > 0) {
      amounts.forEach(amt => allAmounts.push(parseFloat(amt.replace(/,/g, ''))));
    }
  }
  
  // Flag ambiguity if multiple amounts detected
  if (allAmounts.length > 1) {
    intent.signals.ambiguity = true;
  }
  
  extractedAmount = allAmounts.length > 0 ? allAmounts[0] : 0;

  // E. Set Permissions
  if (intent.intent_type === 'analysis') {
    intent.allowed_actions = ['read_data'];
    intent.forbidden_actions = ['trade'];
  } else if (intent.intent_type === 'trade') {
    intent.allowed_actions = ['trade'];
    intent.forbidden_actions = [];
  } else if (intent.intent_type === 'monitor') {
    intent.allowed_actions = ['read_data', 'subscribe'];
    intent.forbidden_actions = ['trade'];
  } else {
    intent.allowed_actions = [];
    intent.forbidden_actions = ['trade'];
  }

  // F. Constraints
  if (intent.intent_type === 'trade') {
    // System enforces maximum, user cannot override
    const userAmount = extractedAmount > 0 ? extractedAmount : SYSTEM_MAX_AMOUNT;
    intent.constraints.max_trade_amount = Math.min(userAmount, SYSTEM_MAX_AMOUNT);
  } else {
    intent.constraints.max_trade_amount = 0;
  }
  intent.constraints.allowed_assets = intent.scope;

  // G. Prompt injection handling moved to ArmorClaw Pre-Validation Layer
  
  // H. Detect Ambiguity
  if (intent.intent_type === 'unknown' || intent.scope.length === 0) {
    intent.signals.ambiguity = true;
  }
  
  if (intent.intent_type === 'trade' && intent.scope.length === 0) {
    intent.signals.ambiguity = true;
  }

  // I. Status
  if (intent.signals.prompt_injection) {
    intent.status = 'unsafe';
  } else if (intent.signals.ambiguity) {
    intent.status = 'ambiguous';
  } else {
    intent.status = 'valid';
  }

  // J. Fail Closed
  intent.fail_closed = intent.signals.ambiguity || intent.signals.prompt_injection || intent.status !== 'valid';

  return intent;
}

module.exports = { extractIntent };
