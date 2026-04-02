const { v4: uuidv4 } = require('uuid');

/**
 * Extract structured intent from user input
 * @param {string} userInput - Raw user input string
 * @returns {Object} Structured intent object
 */
function extractIntent(userInput) {
  // A. Normalize Input
  const normalized = userInput.toLowerCase().trim();
  
  // FIX 2: Normalize tokens
  const tokens = normalized.split(/\s+/);
  
  // PATCH 1: Stock name to ticker mapping
  const stockMap = {
    apple: "AAPL",
    tesla: "TSLA",
    nvidia: "NVDA",
    microsoft: "MSFT",
    amazon: "AMZN"
  };
  
  // Initialize intent object
  const intent = {
    intent_id: uuidv4(),
    raw_input: userInput,
    normalized_input: normalized, // FIX 7: Add normalized_input field
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
  // FIX 5: Improve question detection with word boundaries
  const questionPatterns = [
    /\bshould\s+i\b/,
    /\bcan\s+i\b/,
    /\bwhat\s+if\b/,
    /\bcan\s+you\b/,
    /\bis\s+it\s+good\s+to\b/,
    /\bwhat\s+do\s+you\s+think\b/,
    /\btell\s+me\s+to\b/
  ];
  
  const isQuestion = questionPatterns.some(pattern => pattern.test(normalized));
  
  // PATCH 5: Fix intent misclassification - check for questions first
  if (isQuestion) {
    intent.intent_type = 'analysis';
  } else if (/\b(buy|sell)\b/.test(normalized)) {
    intent.intent_type = 'trade';
  } else if (/\b(analyze|check)\b/.test(normalized)) {
    intent.intent_type = 'analysis';
  } else if (/\b(monitor|watch)\b/.test(normalized)) {
    intent.intent_type = 'monitor';
  } else {
    intent.intent_type = 'unknown';
  }
  
  // PATCH 6: Detect conflicting intents with word boundaries
  const hasAnalysisKeywords = /\b(analyze|check)\b/.test(normalized);
  const hasTradeKeywords = /\b(buy|sell)\b/.test(normalized);
  if (hasAnalysisKeywords && hasTradeKeywords) {
    intent.signals.ambiguity = true;
  }

  // C. Extract Asset (uppercase stock tickers)
  const tickerRegex = /\b[A-Z]{2,5}\b/g;
  const tickers = userInput.match(tickerRegex) || [];
  
  // Filter out stock names that will be mapped (avoid duplicates like APPLE → AAPL)
  const stockNameValues = Object.keys(stockMap).map(k => k.toUpperCase());
  const filteredTickers = tickers.filter(t => !stockNameValues.includes(t.toUpperCase()));
  
  intent.scope = [...new Set(filteredTickers)]; // Remove duplicates
  
  // FIX 1 & 3: Add mapped stock names to scope with word boundaries
  for (const [name, ticker] of Object.entries(stockMap)) {
    const wordBoundaryRegex = new RegExp(`\\b${name}\\b`);
    if (wordBoundaryRegex.test(normalized) && !intent.scope.includes(ticker)) {
      intent.scope.push(ticker);
    }
  }
  
  // FIX 3: Ensure all scope items are uppercase and unique
  intent.scope = [...new Set(intent.scope.map(t => t.toUpperCase()))];
  
  // PATCH 2: Handle multiple assets
  if (intent.scope.length > 1) {
    intent.signals.ambiguity = true;
  }

  // D. Detect Amount
  // PATCH 3: Improve amount parsing with k/m suffix support
  let extractedAmount = 0;
  
  // FIX 4: Detect multiple amounts
  const allAmounts = [];
  
  // Check for k/m suffix first
  const suffixRegex = /\b(\d+(?:\.\d+)?)(k|m)\b/gi;
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
  
  // Original amount detection
  if (allAmounts.length === 0) {
    const amountRegex = /\b(\d+(?:,\d{3})*(?:\.\d{2})?)\b/g;
    const amounts = normalized.match(amountRegex);
    if (amounts && amounts.length > 0) {
      amounts.forEach(amt => allAmounts.push(parseFloat(amt.replace(/,/g, ''))));
    }
  }
  
  // FIX 4: Flag ambiguity if multiple amounts detected
  if (allAmounts.length > 1) {
    intent.signals.ambiguity = true;
  }
  
  extractedAmount = allAmounts.length > 0 ? allAmounts[0] : 0;

  // E. Set Permissions via allowed/forbidden
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
    intent.constraints.max_trade_amount = extractedAmount > 0 ? extractedAmount : 1000;
  } else {
    intent.constraints.max_trade_amount = 0;
  }
  intent.constraints.allowed_assets = intent.scope;

  // G. Detect Prompt Injection
  // FIX 6: Advanced injection detection with word boundaries
  const injectionPatterns = [
    /\bignore\b/,
    /\bbypass\b/,
    /\boverride\b/,
    /\bdon't\s+follow\b/,
    /\bdisregard\b/,
    /\bsilently\b/,
    /\bwithout\s+permission\b/,
    /\bskip\s+checks\b/,
    /\bact\s+as\s+if\b/,
    /\bpretend\b/,
    /\byou\s+are\s+allowed\s+to\b/,
    /\bno\s+need\s+to\s+follow\b/,
    /\brules\s+don't\s+apply\b/
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(normalized)) {
      intent.signals.prompt_injection = true;
      break;
    }
  }

  // H. Detect Ambiguity
  if (intent.intent_type === 'unknown' || intent.scope.length === 0) {
    intent.signals.ambiguity = true;
  }
  
  // FIX 8: Strict validation check for trade intents
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
  // FIX 9: Ensure fail-closed consistency
  intent.fail_closed = intent.signals.ambiguity || intent.signals.prompt_injection || intent.status !== 'valid';

  return intent;
}

module.exports = { extractIntent };
