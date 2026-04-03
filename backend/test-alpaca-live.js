/**
 * Test Alpaca API Integration
 * This script tests the real Alpaca API connection and trading functionality
 */

require('dotenv').config();
const Alpaca = require('@alpacahq/alpaca-trade-api');

async function testAlpacaAPI() {
  console.log('\n=== ALPACA API TEST ===\n');

  // Validate credentials
  if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
    console.error('❌ ERROR: Alpaca credentials not found in .env');
    process.exit(1);
  }

  try {
    // Initialize Alpaca client
    const alpaca = new Alpaca({
      keyId: process.env.ALPACA_API_KEY,
      secretKey: process.env.ALPACA_SECRET_KEY,
      paper: true,
      baseUrl: 'https://paper-api.alpaca.markets'
    });

    console.log('✓ Alpaca client initialized\n');

    // TEST 1: Get Account Info
    console.log('TEST 1: Fetching account information...');
    const account = await alpaca.getAccount();
    console.log('✓ Account Status:', account.status);
    console.log('✓ Buying Power: $' + parseFloat(account.buying_power).toFixed(2));
    console.log('✓ Cash: $' + parseFloat(account.cash).toFixed(2));
    console.log('✓ Portfolio Value: $' + parseFloat(account.portfolio_value).toFixed(2));
    console.log('');

    // TEST 2: Check Market Clock
    console.log('TEST 2: Checking market status...');
    const clock = await alpaca.getClock();
    console.log('✓ Market Open:', clock.is_open ? 'YES ✓' : 'NO ✗');
    console.log('✓ Current Time:', new Date(clock.timestamp).toLocaleString());
    console.log('✓ Next Open:', new Date(clock.next_open).toLocaleString());
    console.log('✓ Next Close:', new Date(clock.next_close).toLocaleString());
    console.log('');

    if (!clock.is_open) {
      console.log('⚠️  Market is currently CLOSED. Orders will be queued until market opens.');
      console.log('');
    }

    // TEST 3: Get Latest Price for AAPL
    console.log('TEST 3: Fetching latest price for AAPL...');
    try {
      const latestTrade = await alpaca.getLatestTrade('AAPL');
      console.log('✓ AAPL Latest Price: $' + latestTrade.Price.toFixed(2));
      console.log('✓ Trade Time:', new Date(latestTrade.Timestamp).toLocaleString());
      console.log('');
    } catch (priceError) {
      console.log('⚠️  Could not fetch price:', priceError.message);
      console.log('');
    }

    // TEST 4: Place a Small Test Order (1 share of AAPL)
    console.log('TEST 4: Placing test order (1 share of AAPL)...');
    
    const testOrder = await alpaca.createOrder({
      symbol: 'AAPL',
      qty: 1,
      side: 'buy',
      type: 'market',
      time_in_force: 'day'
    });

    console.log('✓ Order Submitted Successfully!');
    console.log('✓ Order ID:', testOrder.id);
    console.log('✓ Status:', testOrder.status);
    console.log('✓ Symbol:', testOrder.symbol);
    console.log('✓ Quantity:', testOrder.qty);
    console.log('✓ Side:', testOrder.side);
    console.log('✓ Type:', testOrder.type);
    console.log('✓ Submitted At:', new Date(testOrder.submitted_at).toLocaleString());
    console.log('');

    // TEST 5: Get Order Status
    console.log('TEST 5: Checking order status...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const orderStatus = await alpaca.getOrder(testOrder.id);
    console.log('✓ Current Status:', orderStatus.status);
    console.log('✓ Filled Quantity:', orderStatus.filled_qty);
    console.log('✓ Filled Average Price:', orderStatus.filled_avg_price || 'N/A');
    console.log('');

    // TEST 6: List Recent Orders
    console.log('TEST 6: Fetching recent orders...');
    const orders = await alpaca.getOrders({
      status: 'all',
      limit: 5,
      direction: 'desc'
    });
    
    console.log(`✓ Found ${orders.length} recent orders:`);
    orders.forEach((order, index) => {
      console.log(`  ${index + 1}. ${order.symbol} - ${order.side} ${order.qty} shares - Status: ${order.status}`);
    });
    console.log('');

    console.log('=== ALL TESTS PASSED ✓ ===\n');
    console.log('Your Alpaca API integration is working correctly!');
    console.log('You can now use the real API in your enforcement system.\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nDetails:', error.response?.data || error);
    process.exit(1);
  }
}

// Run tests
testAlpacaAPI();
