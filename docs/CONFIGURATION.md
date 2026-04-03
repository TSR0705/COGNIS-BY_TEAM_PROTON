# Configuration Guide

## Overview

All hardcoded values have been moved to JSON configuration files in `backend/config/`.

## Configuration Files

### 1. `constraints.json`
System-level constraints and limits.

**Key Settings:**
- `system.max_trade_amount`: Maximum shares per trade (default: 1000)
- `system.max_portfolio_exposure`: Maximum dollar exposure per asset
- `market.allowed_asset_classes`: Allowed asset types
- `rate_limits`: Trading frequency limits

### 2. `stock-mappings.json`
Stock name to ticker mappings and allowed tickers.

**Key Settings:**
- `stock_name_to_ticker`: Maps common names to tickers (e.g., "apple" → "AAPL")
- `allowed_tickers`: Whitelist of tradeable tickers
- `blocked_tickers`: Blacklist of forbidden tickers
- `ticker_regex`: Pattern for detecting tickers in input

### 3. `security-patterns.json`
Security detection patterns and intent keywords.

**Key Settings:**
- `prompt_injection_patterns`: Regex patterns for detecting attacks
- `question_patterns`: Patterns for detecting questions
- `intent_keywords`: Keywords for intent classification
- `amount_patterns`: Patterns for parsing trade amounts

### 4. `policy-rules.json`
Declarative policy rules for enforcement.

**Key Settings:**
- `evaluation_strategy`: "deny-overrides" (deny rules take precedence)
- `default_decision`: "deny" (fail-closed)
- `rules`: Array of policy rules with priorities

## How to Modify

### Add New Stock Mapping
Edit `config/stock-mappings.json`:
```json
{
  "stock_name_to_ticker": {
    "spacex": "SPACE",
    ...
  }
}
```

### Change Trade Limit
Edit `config/constraints.json`:
```json
{
  "system": {
    "max_trade_amount": 5000
  }
}
```

### Add Security Pattern
Edit `config/security-patterns.json`:
```json
{
  "prompt_injection_patterns": [
    "\\bnew_attack_pattern\\b"
  ]
}
```

### Add Policy Rule
Edit `config/policy-rules.json`:
```json
{
  "rules": [
    {
      "id": "NEW_RULE",
      "type": "constraint",
      "priority": 5,
      "description": "Your rule description",
      "action": "trade",
      "effect": "deny",
      "conditions": [...]
    }
  ]
}
```

## Configuration Loader

Access configurations in code:
```javascript
const config = require('./config/configLoader');

// Get full config
const constraints = config.getConstraints();
const stockMappings = config.getStockMappings();
const securityPatterns = config.getSecurityPatterns();
const policyRules = config.getPolicyRules();

// Get specific value
const maxAmount = config.get('constraints', 'system.max_trade_amount');
```

## Reload Configuration

Configurations are cached. To reload:
```javascript
config.reload();
```

## Benefits

1. **No Code Changes**: Modify behavior without touching code
2. **Version Control**: Track configuration changes separately
3. **Environment-Specific**: Different configs for dev/prod
4. **Auditable**: Clear history of policy changes
5. **Interpretable**: Non-developers can understand rules
