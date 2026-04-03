const axios = require('axios');

/**
 * Execute trade action via Alpaca API
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
  
  if (typeof action.amount !== 'number') {
    return {
      request_id,
      timestamp,
      status: 'failed',
      error: 'Invalid trade action: amount must be a number'
    };
  }
  
  // ALPACA CONFIG
  const BASE_URL = 'https://paper-api.alpaca.markets/v2/orders';
  const API_KEY = process.env.ALPACA_API_KEY;
  const API_SECRET = process.env.ALPACA_API_SECRET;
  
  // Check API credentials
  if (!API_KEY || !API_SECRET) {
    return {
      request_id,
      timestamp,
      status: 'failed',
      error: 'Alpaca API credentials not configured'
    };
  }
  
  // BUILD ORDER PAYLOAD
  const orderPayload = {
    symbol: action.asset.toUpperCase(),
    qty: action.amount,
    side: 'buy',
    type: 'market',
    time_in_force: 'day',
    client_order_id: request_id
  };
  
  try {
    // SEND REQUEST
    const response = await axios.post(BASE_URL, orderPayload, {
      headers: {
        'APCA-API-KEY-ID': API_KEY,
        'APCA-API-SECRET-KEY': API_SECRET,
        'Content-Type': 'application/json'
      }
    });
    
    // HANDLE SUCCESS
    return {
      request_id,
      timestamp,
      status: 'success',
      order_id: response.data.id,
      asset: action.asset,
      amount: action.amount,
      alpaca_status: response.data.status
    };
    
  } catch (error) {
    // HANDLE ERROR (FAIL SAFE)
    return {
      request_id,
      timestamp,
      status: 'failed',
      error: 'Alpaca API error',
      details: error.message
    };
  }
}

module.exports = { executeTrade };
