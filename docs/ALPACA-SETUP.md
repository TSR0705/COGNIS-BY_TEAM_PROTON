# Alpaca Paper Trading API Setup

## Step 1: Create Alpaca Account

1. Go to https://alpaca.markets/
2. Click "Sign Up" and create a free account
3. Verify your email address

## Step 2: Get Paper Trading API Keys

1. Log in to your Alpaca account
2. Navigate to: https://app.alpaca.markets/paper/dashboard/overview
3. Click on "Your API Keys" in the left sidebar
4. Click "Generate New Key"
5. Copy both:
   - API Key ID
   - Secret Key

⚠️ **IMPORTANT:** Keep your Secret Key secure! Never commit it to Git.

## Step 3: Configure Environment Variables

1. Navigate to `backend` directory
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your Alpaca credentials:
   ```
   ALPACA_API_KEY=your_actual_api_key_here
   ALPACA_SECRET_KEY=your_actual_secret_key_here
   ALPACA_BASE_URL=https://paper-api.alpaca.markets
   ```

## Step 4: Install Dependencies

```bash
cd backend
npm install
```

This will install `@alpacahq/alpaca-trade-api` SDK.

## Step 5: Test Connection

Run the backend server:
```bash
npm run dev
```

Test with a simple trade command:
```bash
curl -X POST http://localhost:5000/api/process \
  -H "Content-Type: application/json" \
  -d '{"input": "Buy 1 AAPL"}'
```

## Expected Behavior

### ✅ Market Open (9:30 AM - 4:00 PM ET, Mon-Fri)
- Order will be submitted to Alpaca
- Response will include real `order_id` from Alpaca
- Check your Alpaca dashboard to see the order

### ❌ Market Closed
```json
{
  "status": "failed",
  "error": "Market is closed",
  "details": {
    "next_open": "2024-01-02T14:30:00Z",
    "next_close": "2024-01-02T21:00:00Z"
  }
}
```

### ❌ Insufficient Buying Power
```json
{
  "status": "failed",
  "error": "Insufficient buying power",
  "details": {
    "required": "15000.00",
    "available": "100000.00",
    "asset": "AAPL",
    "quantity": 100
  }
}
```

## Verify Orders in Alpaca Dashboard

1. Go to https://app.alpaca.markets/paper/dashboard/overview
2. Click "Orders" in the left sidebar
3. You should see your submitted orders

## Paper Trading Limits

- **Initial Balance:** $100,000 (simulated)
- **No Real Money:** All trades use simulated funds
- **Real Market Data:** Prices are real-time
- **Order Types:** Market, limit, stop, stop-limit
- **Time in Force:** Day, GTC, IOC, FOK

## Troubleshooting

### Error: "Alpaca API credentials not configured"
- Check that `.env` file exists in `backend` directory
- Verify `ALPACA_API_KEY` and `ALPACA_SECRET_KEY` are set
- Restart the backend server after updating `.env`

### Error: "Market is closed"
- US stock market hours: 9:30 AM - 4:00 PM ET, Monday-Friday
- Market is closed on US holidays
- Wait for market to open or test during market hours

### Error: "Insufficient buying power"
- Check your paper trading account balance
- Reduce the trade amount
- Reset your paper trading account in Alpaca dashboard

### Error: "Symbol not found"
- Verify the stock ticker is valid (e.g., AAPL, TSLA, NVDA)
- Use uppercase ticker symbols
- Check if the stock is tradable on Alpaca

## Security Best Practices

1. ✅ Never commit `.env` file to Git
2. ✅ Use paper trading API (not production)
3. ✅ Keep Secret Key secure
4. ✅ Rotate API keys periodically
5. ✅ Use environment variables (not hardcoded keys)

## API Documentation

- Alpaca API Docs: https://alpaca.markets/docs/
- Paper Trading: https://alpaca.markets/docs/trading/paper-trading/
- SDK Documentation: https://github.com/alpacahq/alpaca-trade-api-js

## Support

- Alpaca Support: https://alpaca.markets/support
- Community Slack: https://alpaca.markets/slack
