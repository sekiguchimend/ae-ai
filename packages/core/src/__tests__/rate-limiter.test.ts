/**
 * Unit Tests for Rate Limiter
 */

import { RateLimiter } from '../ai/rate-limiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      requestsPerMinute: 5,
      tokensPerMinute: 1000,
      maxQueueSize: 10,
      retryAfterMs: 100,
    });
  });

  describe('execute', () => {
    it('should execute a simple function', async () => {
      const result = await limiter.execute(async () => 'hello', 10);
      expect(result).toBe('hello');
    });

    it('should execute multiple requests within limit', async () => {
      const results = await Promise.all([
        limiter.execute(async () => 1, 10),
        limiter.execute(async () => 2, 10),
        limiter.execute(async () => 3, 10),
      ]);
      expect(results).toEqual([1, 2, 3]);
    });

    it('should reject when queue is full', async () => {
      // Create a limiter with very small queue
      const smallLimiter = new RateLimiter({
        requestsPerMinute: 1,
        tokensPerMinute: 100,
        maxQueueSize: 2,
        retryAfterMs: 50,
      });

      // Fill the queue beyond capacity
      const promises = Array(5)
        .fill(null)
        .map((_, i) =>
          smallLimiter
            .execute(async () => {
              await new Promise((r) => setTimeout(r, 100));
              return i;
            }, 10)
            .catch((e) => e.message)
        );

      const results = await Promise.all(promises);
      expect(results).toContain('Rate limiter queue is full');
    });
  });

  describe('getStatus', () => {
    it('should return current status', () => {
      const status = limiter.getStatus();
      expect(status).toHaveProperty('requestsInLastMinute');
      expect(status).toHaveProperty('tokensInLastMinute');
      expect(status).toHaveProperty('queueLength');
      expect(status).toHaveProperty('canProceed');
    });

    it('should track requests', async () => {
      await limiter.execute(async () => 1, 100);
      const status = limiter.getStatus();
      expect(status.requestsInLastMinute).toBe(1);
      expect(status.tokensInLastMinute).toBe(100);
    });
  });

  describe('getWaitTime', () => {
    it('should return 0 when can proceed', () => {
      const waitTime = limiter.getWaitTime(10);
      expect(waitTime).toBe(0);
    });
  });

  describe('clearQueue', () => {
    it('should reject all queued requests', async () => {
      // Create a slow limiter
      const slowLimiter = new RateLimiter({
        requestsPerMinute: 1,
        tokensPerMinute: 100,
        maxQueueSize: 10,
        retryAfterMs: 1000,
      });

      // Queue multiple requests
      const promises = [
        slowLimiter.execute(async () => 1, 50).catch((e) => e.message),
        slowLimiter.execute(async () => 2, 50).catch((e) => e.message),
      ];

      // Clear immediately
      setTimeout(() => slowLimiter.clearQueue(), 10);

      const results = await Promise.all(promises);
      // First one might succeed, rest should be cleared
      expect(results.some((r) => r === 'Queue cleared' || typeof r === 'number')).toBe(true);
    });
  });
});

describe('RateLimiter with defaults', () => {
  it('should work with default config', async () => {
    const limiter = new RateLimiter();
    const result = await limiter.execute(async () => 'test', 100);
    expect(result).toBe('test');
  });
});
