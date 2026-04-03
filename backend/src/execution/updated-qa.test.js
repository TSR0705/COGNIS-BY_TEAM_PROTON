const axios = require('axios');
const { executeTrade } = require('./executeTrade');

// Mock axios
jest.mock('axios');

describe('Updated Execution Layer - QA Test Suite', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ALPACA_API_KEY = 'test-key';
    process.env.ALPACA_API_SECRET = 'test-secret';
  });

  // TEST 1: LOWERCASE ASSET INPUT
  describe('TEST 1: LOWERCASE ASSET INPUT', () => {
    it('should convert lowercase asset to uppercase in API payload', async () => {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('TEST 1: LOWERCASE ASSET INPUT');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Input: asset = "aapl"');
      console.log('Expected: API payload symbol = "AAPL"');
      
      const request = {
        request_id: 'qa-updated-001',
        timestamp: '2026-04-03T18:00:00Z',
        action: {
          type: 'trade',
          asset: 'aapl',  // LOWERCASE
          amount: 10
        }
      };

      const enforcementResult = {
        decision: 'ALLOW'
      };

      axios.post.mockResolvedValue({
        data: {
          id: 'order-123',
          client_order_id: 'qa-updated-001',
          symbol: 'AAPL',
          qty: 10,
          status: 'accepted'
        }
      });

      const result = await executeTrade(request, enforcementResult);

      // Verify API was called
      expect(axios.post).toHaveBeenCalledTimes(1);
      
      // Get the payload from the API call
      const callArgs = axios.post.mock.calls[0];
      const payload = callArgs[1];
      
      console.log('\nActual API payload symbol:', payload.symbol);
      
      // Check symbol is uppercase
      expect(payload.symbol).toBe('AAPL');
      expect(payload.symbol).not.toBe('aapl');
      
      console.log('✅ PASS: Symbol converted to uppercase');
    });

    it('should handle mixed case asset symbols', async () => {
      const request = {
        request_id: 'qa-updated-002',
        timestamp: '2026-04-03T18:05:00Z',
        action: {
          type: 'trade',
          asset: 'TsLa',  // MIXED CASE
          amount: 5
        }
      };

      const enforcementResult = {
        decision: 'ALLOW'
      };

      axios.post.mockResolvedValue({
        data: {
          id: 'order-456',
          symbol: 'TSLA',
          status: 'accepted'
        }
      });

      await executeTrade(request, enforcementResult);

      const payload = axios.post.mock.calls[0][1];
      
      expect(payload.symbol).toBe('TSLA');
      expect(payload.symbol).not.toBe('TsLa');
    });
  });

  // TEST 2: SUCCESS RESPONSE
  describe('TEST 2: SUCCESS RESPONSE - alpaca_status Field', () => {
    it('should include alpaca_status field in success response', async () => {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('TEST 2: SUCCESS RESPONSE');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Expected: alpaca_status field present');
      console.log('Expected: value matches response.data.status');
      
      const request = {
        request_id: 'qa-updated-003',
        timestamp: '2026-04-03T18:10:00Z',
        action: {
          type: 'trade',
          asset: 'AAPL',
          amount: 10
        }
      };

      const enforcementResult = {
        decision: 'ALLOW'
      };

      const mockStatus = 'accepted';
      axios.post.mockResolvedValue({
        data: {
          id: 'order-abc',
          client_order_id: 'qa-updated-003',
          symbol: 'AAPL',
          qty: 10,
          status: mockStatus  // Alpaca order status
        }
      });

      const result = await executeTrade(request, enforcementResult);

      console.log('\nResponse fields:');
      console.log('  request_id:', result.request_id);
      console.log('  timestamp:', result.timestamp);
      console.log('  status:', result.status);
      console.log('  order_id:', result.order_id);
      console.log('  asset:', result.asset);
      console.log('  amount:', result.amount);
      console.log('  alpaca_status:', result.alpaca_status);
      
      // Check alpaca_status is present
      expect(result.alpaca_status).toBeDefined();
      console.log('✅ PASS: alpaca_status field present');
      
      // Check alpaca_status matches response.data.status
      expect(result.alpaca_status).toBe(mockStatus);
      console.log('✅ PASS: alpaca_status matches response.data.status');
      
      // Verify all required fields
      expect(result.request_id).toBe('qa-updated-003');
      expect(result.timestamp).toBe('2026-04-03T18:10:00Z');
      expect(result.status).toBe('success');
      expect(result.order_id).toBe('order-abc');
      expect(result.asset).toBe('AAPL');
      expect(result.amount).toBe(10);
    });

    it('should handle different Alpaca status values', async () => {
      const statuses = ['accepted', 'pending_new', 'filled', 'partially_filled', 'rejected'];

      for (const status of statuses) {
        const request = {
          request_id: `qa-status-${status}`,
          timestamp: '2026-04-03T18:15:00Z',
          action: {
            type: 'trade',
            asset: 'AAPL',
            amount: 10
          }
        };

        const enforcementResult = {
          decision: 'ALLOW'
        };

        axios.post.mockResolvedValue({
          data: {
            id: `order-${status}`,
            status: status
          }
        });

        const result = await executeTrade(request, enforcementResult);

        expect(result.alpaca_status).toBe(status);
      }
    });
  });

  // TEST 3: REGRESSION
  describe('TEST 3: REGRESSION - Previous Tests Must Pass', () => {
    it('should still block when enforcement denies', async () => {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('TEST 3: REGRESSION');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Re-running previous tests...');
      console.log('\n[Regression 1] Blocked flow:');
      
      const request = {
        request_id: 'regression-001',
        timestamp: '2026-04-03T18:20:00Z',
        action: {
          type: 'trade',
          asset: 'AAPL',
          amount: 10
        }
      };

      const enforcementResult = {
        decision: 'BLOCK'
      };

      const result = await executeTrade(request, enforcementResult);

      expect(result.status).toBe('blocked');
      expect(axios.post).not.toHaveBeenCalled();
      console.log('  ✅ PASS: Blocked flow still works');
    });

    it('should still validate missing asset', async () => {
      console.log('\n[Regression 2] Invalid action - missing asset:');
      
      const request = {
        request_id: 'regression-002',
        timestamp: '2026-04-03T18:25:00Z',
        action: {
          type: 'trade',
          // missing asset
          amount: 10
        }
      };

      const enforcementResult = {
        decision: 'ALLOW'
      };

      const result = await executeTrade(request, enforcementResult);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('missing asset');
      expect(axios.post).not.toHaveBeenCalled();
      console.log('  ✅ PASS: Missing asset validation still works');
    });

    it('should still validate action type', async () => {
      console.log('\n[Regression 3] Invalid action type:');
      
      const request = {
        request_id: 'regression-003',
        timestamp: '2026-04-03T18:30:00Z',
        action: {
          type: 'withdraw',
          asset: 'AAPL',
          amount: 10
        }
      };

      const enforcementResult = {
        decision: 'ALLOW'
      };

      const result = await executeTrade(request, enforcementResult);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('type must be "trade"');
      expect(axios.post).not.toHaveBeenCalled();
      console.log('  ✅ PASS: Action type validation still works');
    });

    it('should still validate amount type', async () => {
      console.log('\n[Regression 4] Invalid amount type:');
      
      const request = {
        request_id: 'regression-004',
        timestamp: '2026-04-03T18:35:00Z',
        action: {
          type: 'trade',
          asset: 'AAPL',
          amount: '10'  // string
        }
      };

      const enforcementResult = {
        decision: 'ALLOW'
      };

      const result = await executeTrade(request, enforcementResult);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('amount must be a number');
      expect(axios.post).not.toHaveBeenCalled();
      console.log('  ✅ PASS: Amount type validation still works');
    });

    it('should still check credentials', async () => {
      console.log('\n[Regression 5] Missing credentials:');
      
      delete process.env.ALPACA_API_KEY;
      delete process.env.ALPACA_API_SECRET;

      const request = {
        request_id: 'regression-005',
        timestamp: '2026-04-03T18:40:00Z',
        action: {
          type: 'trade',
          asset: 'AAPL',
          amount: 10
        }
      };

      const enforcementResult = {
        decision: 'ALLOW'
      };

      const result = await executeTrade(request, enforcementResult);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('credentials not configured');
      expect(axios.post).not.toHaveBeenCalled();
      console.log('  ✅ PASS: Credential check still works');
      
      // Restore
      process.env.ALPACA_API_KEY = 'test-key';
      process.env.ALPACA_API_SECRET = 'test-secret';
    });

    it('should still handle API errors', async () => {
      console.log('\n[Regression 6] API error handling:');
      
      const request = {
        request_id: 'regression-006',
        timestamp: '2026-04-03T18:45:00Z',
        action: {
          type: 'trade',
          asset: 'INVALID',
          amount: 10
        }
      };

      const enforcementResult = {
        decision: 'ALLOW'
      };

      axios.post.mockRejectedValue(new Error('symbol INVALID is not found'));

      const result = await executeTrade(request, enforcementResult);

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Alpaca API error');
      expect(result.details).toContain('INVALID');
      console.log('  ✅ PASS: API error handling still works');
    });

    it('should still use request_id as client_order_id', async () => {
      console.log('\n[Regression 7] client_order_id tracking:');
      
      const request = {
        request_id: 'regression-007-unique',
        timestamp: '2026-04-03T18:50:00Z',
        action: {
          type: 'trade',
          asset: 'TSLA',
          amount: 5
        }
      };

      const enforcementResult = {
        decision: 'ALLOW'
      };

      axios.post.mockResolvedValue({
        data: {
          id: 'order-xyz',
          status: 'accepted'
        }
      });

      await executeTrade(request, enforcementResult);

      const payload = axios.post.mock.calls[0][1];
      expect(payload.client_order_id).toBe('regression-007-unique');
      console.log('  ✅ PASS: client_order_id tracking still works');
    });
  });
});
