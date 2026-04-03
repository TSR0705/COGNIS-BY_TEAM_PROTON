const axios = require('axios');
const { executeTrade } = require('./executeTrade');

// Mock axios
jest.mock('axios');

describe('Execution Layer - QA Test Suite', () => {
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Set mock environment variables
    process.env.ALPACA_API_KEY = 'test-key';
    process.env.ALPACA_API_SECRET = 'test-secret';
  });

  // TEST 1: BLOCKED FLOW
  describe('TEST 1: BLOCKED FLOW - Enforcement Denies', () => {
    it('should return blocked status when enforcement decision is BLOCK', async () => {
      const request = {
        request_id: 'qa-exec-001',
        timestamp: '2026-04-03T16:00:00Z',
        action: {
          type: 'trade',
          asset: 'AAPL',
          amount: 10
        }
      };

      const enforcementResult = {
        decision: 'BLOCK',
        matched_rule: 'DENY_TRADE_IF_NOT_ALLOWED',
        reason: 'Block trade if intent does not permit it'
      };

      const result = await executeTrade(request, enforcementResult);

      // Assertions
      expect(result.status).toBe('blocked');
      expect(result.message).toBe('Execution skipped due to enforcement');
      expect(result.request_id).toBe('qa-exec-001');
      expect(result.timestamp).toBe('2026-04-03T16:00:00Z');
      expect(result.order_id).toBeUndefined();
      
      // Verify no API call was made
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  // TEST 2: INVALID ACTION - Missing Asset
  describe('TEST 2: INVALID ACTION - Missing Asset', () => {
    it('should return failed status when asset is missing', async () => {
      const request = {
        request_id: 'qa-exec-002',
        timestamp: '2026-04-03T16:05:00Z',
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

      // Assertions
      expect(result.status).toBe('failed');
      expect(result.error).toContain('missing asset');
      expect(result.request_id).toBe('qa-exec-002');
      expect(result.timestamp).toBe('2026-04-03T16:05:00Z');
      
      // Verify no API call was made
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  // TEST 3: VALID TRADE - Mock API Success
  describe('TEST 3: VALID TRADE - Mock API Success', () => {
    it('should return success status with order_id when API succeeds', async () => {
      const request = {
        request_id: 'qa-exec-003',
        timestamp: '2026-04-03T16:10:00Z',
        action: {
          type: 'trade',
          asset: 'AAPL',
          amount: 10
        }
      };

      const enforcementResult = {
        decision: 'ALLOW'
      };

      // Mock successful API response
      const mockOrderId = 'mock-order-123';
      axios.post.mockResolvedValue({
        data: {
          id: mockOrderId,
          client_order_id: 'qa-exec-003',
          symbol: 'AAPL',
          qty: 10,
          side: 'buy',
          type: 'market',
          status: 'accepted'
        }
      });

      const result = await executeTrade(request, enforcementResult);

      // Assertions
      expect(result.status).toBe('success');
      expect(result.order_id).toBe(mockOrderId);
      expect(result.asset).toBe('AAPL');
      expect(result.amount).toBe(10);
      expect(result.request_id).toBe('qa-exec-003');
      expect(result.timestamp).toBe('2026-04-03T16:10:00Z');
      
      // Verify API was called
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        'https://paper-api.alpaca.markets/v2/orders',
        expect.objectContaining({
          symbol: 'AAPL',
          qty: 10,
          side: 'buy',
          type: 'market',
          time_in_force: 'day',
          client_order_id: 'qa-exec-003'
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'APCA-API-KEY-ID': 'test-key',
            'APCA-API-SECRET-KEY': 'test-secret',
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  // TEST 4: API FAILURE - Simulate API Error
  describe('TEST 4: API FAILURE - Simulate API Error', () => {
    it('should return failed status when API returns error', async () => {
      const request = {
        request_id: 'qa-exec-004',
        timestamp: '2026-04-03T16:15:00Z',
        action: {
          type: 'trade',
          asset: 'INVALID',
          amount: 10
        }
      };

      const enforcementResult = {
        decision: 'ALLOW'
      };

      // Mock API error
      axios.post.mockRejectedValue(new Error('symbol INVALID is not found'));

      const result = await executeTrade(request, enforcementResult);

      // Assertions
      expect(result.status).toBe('failed');
      expect(result.error).toBe('Alpaca API error');
      expect(result.details).toContain('INVALID');
      expect(result.request_id).toBe('qa-exec-004');
      expect(result.timestamp).toBe('2026-04-03T16:15:00Z');
      
      // Verify API was called
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });

  // TEST 5: CLIENT ORDER ID - Matches request_id
  describe('TEST 5: CLIENT ORDER ID - Matches request_id', () => {
    it('should use request_id as client_order_id in API payload', async () => {
      const request = {
        request_id: 'qa-exec-005-unique-id',
        timestamp: '2026-04-03T16:20:00Z',
        action: {
          type: 'trade',
          asset: 'TSLA',
          amount: 5
        }
      };

      const enforcementResult = {
        decision: 'ALLOW'
      };

      // Mock successful API response
      axios.post.mockResolvedValue({
        data: {
          id: 'order-456',
          client_order_id: 'qa-exec-005-unique-id',
          symbol: 'TSLA',
          qty: 5
        }
      });

      const result = await executeTrade(request, enforcementResult);

      // Assertions
      expect(result.status).toBe('success');
      
      // Verify API was called with correct payload
      expect(axios.post).toHaveBeenCalledTimes(1);
      
      const callArgs = axios.post.mock.calls[0];
      const payload = callArgs[1];
      
      // Check client_order_id matches request_id
      expect(payload.client_order_id).toBe('qa-exec-005-unique-id');
      
      // Check payload structure
      expect(payload.symbol).toBe('TSLA');
      expect(payload.qty).toBe(5);
      expect(payload.side).toBe('buy');
      expect(payload.type).toBe('market');
      expect(payload.time_in_force).toBe('day');
    });
  });

  // ADDITIONAL TEST: Invalid Action Type
  describe('ADDITIONAL TEST: Invalid Action Type', () => {
    it('should return failed status when action type is not "trade"', async () => {
      const request = {
        request_id: 'qa-exec-006',
        timestamp: '2026-04-03T16:25:00Z',
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

      // Assertions
      expect(result.status).toBe('failed');
      expect(result.error).toContain('type must be "trade"');
      
      // Verify no API call was made
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  // ADDITIONAL TEST: Invalid Amount Type
  describe('ADDITIONAL TEST: Invalid Amount Type', () => {
    it('should return failed status when amount is not a number', async () => {
      const request = {
        request_id: 'qa-exec-007',
        timestamp: '2026-04-03T16:30:00Z',
        action: {
          type: 'trade',
          asset: 'AAPL',
          amount: '10'  // string, not number
        }
      };

      const enforcementResult = {
        decision: 'ALLOW'
      };

      const result = await executeTrade(request, enforcementResult);

      // Assertions
      expect(result.status).toBe('failed');
      expect(result.error).toContain('amount must be a number');
      
      // Verify no API call was made
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  // ADDITIONAL TEST: Missing Credentials
  describe('ADDITIONAL TEST: Missing Credentials', () => {
    it('should return failed status when API credentials are not configured', async () => {
      // Clear environment variables
      delete process.env.ALPACA_API_KEY;
      delete process.env.ALPACA_API_SECRET;

      const request = {
        request_id: 'qa-exec-008',
        timestamp: '2026-04-03T16:35:00Z',
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

      // Assertions
      expect(result.status).toBe('failed');
      expect(result.error).toContain('credentials not configured');
      
      // Verify no API call was made
      expect(axios.post).not.toHaveBeenCalled();
    });
  });
});
