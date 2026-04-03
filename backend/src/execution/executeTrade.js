const Alpaca = require('@alpacahq/alpaca-trade-api');

/**
 * Execute trade action via Alpaca Paper Trading API
 * @param {Object} request - Request object with action details
 * @param {Object} enforcementResult - Enforcement decision result
 * @returns {Object} Execution result
 */
async function executeTrade(request, enforcementResult) {
  const { request_id, timestamp, action } = request;
  
  // SAFETY CHECK (CRITICAL)
  // Only execute if enforcement explicitly allows
  if (enforcementResult.decision !== 'ALLOW') {
    return {
      request_id,
      timestamp,
      status: 'blocked',
      message: 'Execution skipped due to enforcement'
    };
  }
  
  // VALIDATE ACTION
  if (!action || action.type !== 'trade') {
    return {
      request_id,
      timestamp,
      status: 'failed',
      error: 'Invalid trade action: type must be "trade"'
    };
  }
  
  if (!action.asset) {
    return {
      request_id,
      timestamp,
      status: 'failed',
      error: 'Invalid trade action: missing asset'
    };
  }
  
  if (typeof action.amount !== 'number' || action.amount <= 0) {
    return {
      request_id,
      timestamp,
      status: 'failed',
      error: 'Invalid trade action: amount must be a positive number'
    };
  }

  // VALIDATE ENVIRONMENT VARIABLES
  if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
    return {
      request_id,
      timestamp,
      status: 'failed',
      error: 'Alpaca API credentials not configured'
    };
  }

  try {
    // INITIALIZE ALPACA CLIENT
    const alpaca = new Alpaca({
      keyId: process.env.ALPACA_API_KEY,
      secretKey: process.env.ALPACA_SECRET_KEY,
      paper: true,
      baseUrl: process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets'
    });

    // STEP 1: CHECK MARKET CLOCK
    const clock = await alpaca.getClock();
    
    if (!clock.is_open) {
      return {
        request_id,
        timestamp,
        status: 'failed',
        error: 'Market is closed',
        details: {
          next_open: clock.next_open,
          next_close: clock.next_close
        }
      };
    }

    // STEP 2: FETCH ACCOUNT DETAILS
    const account = await alpaca.getAccount();
    
    const buyingPower = parseFloat(account.buying_power);
    
    // STEP 3: GET CURRENT PRICE (ESTIMATE)
    let estimatedCost = 0;
    try {
      const latestTrade = await alpaca.getLatestTrade(action.asset);
      const currentPrice = latestTrade.Price;
      estimatedCost = currentPrice * action.amount;
    } catch (priceError) {
      // If we can't get price, proceed anyway (Alpaca will validate)
      console.warn(`Could not fetch price for ${action.asset}:`, priceError.message);
    }

    // STEP 4: VALIDATE BUYING POWER
    if (estimatedCost > 0 && buyingPower < estimatedCost) {
      return {
        request_id,
        timestamp,
        status: 'failed',
        error: 'Insufficient buying power',
        details: {
          required: estimatedCost.toFixed(2),
          available: buyingPower.toFixed(2),
          asset: action.asset,
          quantity: action.amount
        }
      };
    }

    // STEP 5: PLACE REAL ORDER
    const order = await alpaca.createOrder({
      symbol: action.asset,
      qty: action.amount,
      side: 'buy',
      type: 'market',
      time_in_force: 'day'
    });

    // STEP 6: RETURN SUCCESS
    return {
      request_id,
      timestamp,
      status: 'success',
      order_id: order.id,
      alpaca_status: order.status,
      filled_qty: order.filled_qty || 0,
      asset: action.asset,
      amount: action.amount,
      submitted_at: order.submitted_at,
      message: 'Order submitted successfully to Alpaca'
    };

  } catch (error) {
    // STEP 7: HANDLE ALL ERRORS GRACEFULLY
    console.error('Alpaca API error:', error.message);
    
    return {
      request_id,
      timestamp,
      status: 'failed',
      error: 'Alpaca API error',
      details: error.message || 'Unknown error occurred'
    };
  }
}

module.exports = { executeTrade };
