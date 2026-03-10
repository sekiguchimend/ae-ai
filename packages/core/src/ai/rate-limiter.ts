/**
 * Rate Limiter for LLM API Calls
 * Implements token bucket algorithm with request queuing
 */

export interface RateLimiterConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
  maxQueueSize: number;
  retryAfterMs: number;
}

export interface QueuedRequest<T> {
  id: string;
  fn: () => Promise<T>;
  tokenEstimate: number;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  addedAt: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  requestsPerMinute: 60,
  tokensPerMinute: 90000,
  maxQueueSize: 100,
  retryAfterMs: 1000,
};

export class RateLimiter {
  private config: RateLimiterConfig;
  private requestTimestamps: number[] = [];
  private tokenUsage: { timestamp: number; tokens: number }[] = [];
  private queue: QueuedRequest<unknown>[] = [];
  private processing = false;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate unique request ID
   */
  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old timestamps (older than 1 minute)
   */
  private cleanupTimestamps(): void {
    const oneMinuteAgo = Date.now() - 60000;

    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => ts > oneMinuteAgo
    );

    this.tokenUsage = this.tokenUsage.filter(
      (usage) => usage.timestamp > oneMinuteAgo
    );
  }

  /**
   * Check if request can proceed
   */
  private canProceed(tokenEstimate: number): boolean {
    this.cleanupTimestamps();

    // Check request limit
    if (this.requestTimestamps.length >= this.config.requestsPerMinute) {
      return false;
    }

    // Check token limit
    const currentTokenUsage = this.tokenUsage.reduce(
      (sum, usage) => sum + usage.tokens,
      0
    );
    if (currentTokenUsage + tokenEstimate > this.config.tokensPerMinute) {
      return false;
    }

    return true;
  }

  /**
   * Record a request
   */
  private recordRequest(tokenEstimate: number): void {
    const now = Date.now();
    this.requestTimestamps.push(now);
    this.tokenUsage.push({ timestamp: now, tokens: tokenEstimate });
  }

  /**
   * Get time until next available slot
   */
  public getWaitTime(tokenEstimate: number): number {
    this.cleanupTimestamps();

    if (this.canProceed(tokenEstimate)) {
      return 0;
    }

    // Calculate wait time based on oldest request
    if (this.requestTimestamps.length > 0) {
      const oldestRequest = Math.min(...this.requestTimestamps);
      const waitTime = oldestRequest + 60000 - Date.now();
      return Math.max(0, waitTime);
    }

    return this.config.retryAfterMs;
  }

  /**
   * Execute request with rate limiting
   */
  public async execute<T>(
    fn: () => Promise<T>,
    tokenEstimate: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id: this.generateId(),
        fn,
        tokenEstimate,
        resolve: resolve as (value: unknown) => void,
        reject,
        addedAt: Date.now(),
      };

      if (this.queue.length >= this.config.maxQueueSize) {
        reject(new Error('Rate limiter queue is full'));
        return;
      }

      this.queue.push(request as QueuedRequest<unknown>);
      this.processQueue();
    });
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue[0];

      if (this.canProceed(request.tokenEstimate)) {
        this.queue.shift();
        this.recordRequest(request.tokenEstimate);

        try {
          const result = await request.fn();
          request.resolve(result);
        } catch (error) {
          // Check for rate limit errors from API
          if (this.isRateLimitError(error)) {
            // Re-queue the request
            this.queue.unshift(request);
            await this.sleep(this.config.retryAfterMs);
          } else {
            request.reject(error instanceof Error ? error : new Error(String(error)));
          }
        }
      } else {
        const waitTime = this.getWaitTime(request.tokenEstimate);
        await this.sleep(waitTime);
      }
    }

    this.processing = false;
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('rate limit') ||
        message.includes('too many requests') ||
        message.includes('429')
      );
    }
    return false;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current status
   */
  public getStatus(): {
    requestsInLastMinute: number;
    tokensInLastMinute: number;
    queueLength: number;
    canProceed: boolean;
  } {
    this.cleanupTimestamps();

    const tokensInLastMinute = this.tokenUsage.reduce(
      (sum, usage) => sum + usage.tokens,
      0
    );

    return {
      requestsInLastMinute: this.requestTimestamps.length,
      tokensInLastMinute,
      queueLength: this.queue.length,
      canProceed: this.canProceed(1000), // Check with average token estimate
    };
  }

  /**
   * Clear the queue
   */
  public clearQueue(): void {
    for (const request of this.queue) {
      request.reject(new Error('Queue cleared'));
    }
    this.queue = [];
  }
}

// Export singleton instances for different providers
export const openAILimiter = new RateLimiter({
  requestsPerMinute: 60,
  tokensPerMinute: 90000,
});

export const claudeLimiter = new RateLimiter({
  requestsPerMinute: 60,
  tokensPerMinute: 100000,
});
