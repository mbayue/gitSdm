import { AppError } from '../utils/errors';

export function isEmbeddingRateLimit(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'status' in error && Number(error.status) === 429) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /429|rate.?limit|too many requests|resource_exhausted/i.test(message);
}

export function embeddingRetryAfter(error: unknown): number {
  if (typeof error !== 'object' || error === null || !('headers' in error)) return 60;
  const headers = error.headers;
  const value = headers instanceof Headers ? headers.get('retry-after') :
    typeof headers === 'object' && headers !== null && 'retry-after' in headers ? String(headers['retry-after']) : null;
  if (!value) return 60;
  const seconds = Number(value);
  const delay = Number.isFinite(seconds) ? seconds : (Date.parse(value) - Date.now()) / 1000;
  return Number.isFinite(delay) && delay > 0 ? Math.min(3600, Math.max(1, Math.ceil(delay))) : 60;
}

export async function withEmbeddingRetry<T>(
  work: () => Promise<T>,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await work();
    } catch (error) {
      // Application admission failures already carry their own reason and reset time.
      if (error instanceof AppError) throw error;
      const rateLimited = isEmbeddingRateLimit(error);
      if (rateLimited) {
        const retryAfterSeconds = embeddingRetryAfter(error);
        throw new AppError(429, `Embedding provider rate limit reached. Retry after ${retryAfterSeconds} seconds; indexing a smaller scope may help.`, 'EMBEDDING_RATE_LIMITED', true, { retryAfterSeconds });
      }
      const timeout = error instanceof Error && /timeout/i.test(error.message);
      if (!rateLimited && !timeout) throw error;
      if (attempt === 2) {
        throw error;
      }
      await sleep(1000 * 2 ** attempt);
    }
  }
}
