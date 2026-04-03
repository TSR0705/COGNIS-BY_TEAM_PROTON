const axios = require('axios');
const { executeTrade } = require('./executeTrade');

// Mock axios
jest.mock('axios');

describe('Execution Layer - Fixes Validation', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ALPACA_API_KEY = 'test-key';
    process.env.ALPACA_API_SECRET = 'test-secret';
  });

  // FIX 1: NORMALIZE ASSET SYMBOL
  describe('FIX 1: Normalize Asset Symbol to Uppercase', () => {
    it('should convert lowercase asset symbol to uppercase in API payload', async () => {
      const request = {
        request_id: 'fix-test-001',
        timestamp: '2026-04-03T17:00:00Z',
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
          client_order_id: 'fix-test-001',
          symbol: 'AAPL',
          qty: 10,
          status: 'accepted'
        }
      });

      await executeTrade(request, enforcementResult);

      // Verify API was called with uppercase symbol
      expect(axios.post).toHaveBeenCalledTimes(1);
      const callArgs = axios.post.mock.calls[0];
      const payload = callArgs[1];
      
      expect(payload.symbol).toBe('AAPL');  // Should be uppercase
      expect(payload.symbol).not.toBe('aapl');  // Should not be lowercase
    });

    it('should handle mixed case asset symbols', async () => {
      const request = {
        request_id: 'fix-test-002',
        timestamp: '2026-04-03T17:05:00Z',
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
      expect(payload.symbol).toBe('TSLA');  // Should be uppercase
    });

    it('should keep already uppercase symbols unchanged', async () => {
      const request = {
        request_id: 'fix-test-003',
        timestamp: '2026-04-03T17:10:00Z',
        action: {
          type: 'trade',
          asset: 'NVDA',  // ALREADY UPPERCASE
          amount: 15
        }
      };

      const enforcementResult = {
        decision: 'ALLOW'
      };

      axios.post.mockResolvedValue({
        data: {
          id: 'order-789',
          symbol: 'NVDA',
          status: 'accepted'
        }
      });

      await executeTrade(request, enforcementResult);

      const payload = axios.post.mock.calls[0][1];
      expect(payload.symbol).toBe('NVDA');  // Should remain uppercase
    });
  });

  // FIX 2: ADD ALPACA STATUS IN RESPONSE
  describe('FIX 2: Add alpaca_status in Success Response', () => {
    it('should include alpaca_status in success response', async () => {
      const request = {
        request_id: 'fix-test-004',
        timestamp: '2026-04-03T17:15:00Z',
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
          id: 'order-abc',
          client_order_id: 'fix-test-004',
          symbol: 'AAPL',
          qty: 10,
          status: 'accepted'  // Alpaca order status
        }
      });

      const result = await executeTrade(request, enforcementResult);

      // Verify alpaca_status is included
      expect(result.alpaca_status).toBe('accepted');
      expect(result.alpaca_status).toBeDefined();
    });

    it('should handle different Alpaca status values', async () => {
      const statuses = ['accepted', 'pending_new', 'filled', 'partially_filled'];

      for (const status of statuses) {
        const request = {
          request_id: `fix-test-${status}`,
          timestamp: '2026-04-03T17:20:00Z',
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

    it('should include all required fields in success response', async () => {
      const request = {
        request_id: 'fix-test-005',
        timestamp: '2026-04-03T17:25:00Z',
        action: {
          type: 'trade',
          asset: 'MSFT',
          amount: 20
        }
      };

      const enforcementResult = {
        decision: 'ALLOW'
      };

      axios.post.mockResolvedValue({
        data: {
          id: 'order-xyz',
          client_order_id: 'fix-test-005',
          symbol: 'MSFT',
          qty: 20,
          status: 'filled'
        }
      });

      const result = await executeTrade(request, enforcementResult);

      // Verify all required fields
      expect(result.request_id).toBe('fix-test-005');
      expect(result.timestamp).toBe('2026-04-03T17:25:00Z');
      expect(result.status).toBe('success');
      expect(result.order_id).toBe('order-xyz');
      expect(result.asset).toBe('MSFT');
      expect(result.amount).toBe(20);
      expect(result.alpaca_status).toBe('filled');  // NEW FIELD
    });
  });

  // CONSISTENCY CHECK
  describe('CONSISTENCY: All Success Responses Include alpaca_status', () => {
    it('should always include alpaca_status in success responses', async () => {
      const testCases = [
        { asset: 'AAPL', amount: 10 },
        { asset: 'tsla', amount: 5 },
        { asset: 'NVDA', amount: 15 },
        { asset: 'MsFt', amount: 20 }
      ];

      for (const testCase of testCases) {
        const request = {
          request_id: `consistency-${testCase.asset}`,
          timestamp: '2026-04-03T17:30:00Z',
          action: {
            type: 'trade',
            asset: testCase.asset,
            amount: testCase.amount
          }
        };

        const enforcementResult = {
          decision: 'ALLOW'
        };

        axios.post.mockResolvedValue({
          data: {
            id: `order-${testCase.asset}`,
            status: 'accepted'
          }
        });

        const result = await executeTrade(request, enforcementResult);

        // Every success response must have alpaca_status
        expect(result.status).toBe('success');
        expect(result.alpaca_status).toBeDefined();
        expect(typeof result.alpaca_status).toBe('string');
      }
    });
  });
});

// Run tests
if (require.main === module) {
  console.log('Run with: npx jest src/execution/test-fixes.js');
}
