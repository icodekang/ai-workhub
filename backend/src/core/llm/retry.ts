/**
 * Retry with exponential backoff
 * Reference: AI Town convex/util/llm.ts - retryWithBackoff()
 */

const RETRY_BACKOFF = [1000, 10000, 20000]; // ms

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RetryResult<T> {
  retries: number;
  result: T;
  ms: number;
}

/**
 * Retry a function with exponential backoff.
 * Retries on 429 and 5xx errors up to RETRY_BACKOFF.length + 1 times.
 */
export async function retryWithBackoff<T>(
  fn: (attempt: number) => Promise<T>
): Promise<RetryResult<T>> {
  let i = 0;
  for (; i <= RETRY_BACKOFF.length; i++) {
    try {
      const start = Date.now();
      const result = await fn(i);
      return { retries: i, result, ms: Date.now() - start };
    } catch (error: unknown) {
      const err = error as { retry?: boolean; message?: string };
      if (i === RETRY_BACKOFF.length || !err?.retry) {
        throw error;
      }
      const jitter = Math.random() * 100;
      await sleep(RETRY_BACKOFF[i] + jitter);
    }
  }
  throw new Error('retryWithBackoff: unexpected end of loop');
}
