/**
 * RetryHandler - Exponential backoff retry logic for transient failures
 *
 * Part of TASK-3.5 - Task Execution Engine
 */

export const MAX_RETRIES = 3;
const RETRY_DELAYS = [5000, 30000, 60000]; // ms: 5s, 30s, 60s

const RETRYABLE_PATTERNS = [
  'timeout',
  'rate limit',
  'network',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  '503',
  '502',
  '429',
  'ECONNREFUSED',
];

export class RetryHandler {
  /**
   * Check if an error is retryable based on message patterns
   */
  isRetryable(error: Error): boolean {
    const msg = error.message.toLowerCase();
    return RETRYABLE_PATTERNS.some((p) => msg.includes(p.toLowerCase()));
  }

  /**
   * Sleep for a given duration
   */
  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Execute a function with retry logic
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error as Error;

        if (!this.isRetryable(lastError)) {
          console.warn(`[RetryHandler] Non-retryable error for ${context}: ${lastError.message}`);
          throw lastError;
        }

        if (attempt < MAX_RETRIES - 1) {
          const delay = RETRY_DELAYS[attempt] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
          console.warn(`[RetryHandler] Retry ${attempt + 1}/${MAX_RETRIES} for ${context} after ${delay}ms: ${lastError.message}`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }
}

// Singleton instance
export const retryHandler = new RetryHandler();
