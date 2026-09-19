import type { EmbeddingProvider } from './types';
import { createBoundedQueue } from '../utils/bounded-queue';
import { configuredLimit, reserveUsage } from '../utils/usage-limits';
import { AppError } from '../utils/errors';
import { withEmbeddingRetry } from './embedding-retry';

const queue = createBoundedQueue(2, 8, 10000, 30000);
let nextStart = 0;
let cooldownUntil = 0;

function rateLimitError(): AppError {
  const retryAfterSeconds = Math.max(1, Math.ceil((cooldownUntil - Date.now()) / 1000));
  const error = new AppError(
    429,
    `Embedding provider is cooling down. Retry after ${retryAfterSeconds} seconds.`,
    'EMBEDDING_RATE_LIMITED',
    true,
    { retryAfterSeconds },
  );
  // Marker distinguishes locally-raised cooldown errors from provider-originated
  // 429s so retries preserve the existing deadline instead of extending it.
  (error.context as Record<string, unknown>).localCooldown = true;
  return error;
}

function isLocalCooldownError(error: AppError): boolean {
  return error.context?.localCooldown === true;
}

async function pace(signal: AbortSignal): Promise<void> {
  if (Date.now() < cooldownUntil) throw rateLimitError();
  const start = Math.max(Date.now(), nextStart);
  nextStart = start + configuredLimit('EMBEDDING_REQUEST_INTERVAL_MS', 1000);
  const delay = start - Date.now();
  if (delay > 0)
    await new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(new AppError(504, 'Provider request timed out.', 'PROVIDER_TIMEOUT', true));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', abort);
        resolve();
      }, delay);
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) abort();
    });
  if (Date.now() < cooldownUntil) throw rateLimitError();
}
export function protectEmbeddings(provider: EmbeddingProvider, reserve = reserveUsage): EmbeddingProvider {
  const run = <T>(texts: string[], work: (signal: AbortSignal) => Promise<T>, callerSignal?: AbortSignal) => {
    const bytes = texts.reduce((sum, text) => sum + Buffer.byteLength(text), 0);
    if (bytes > 256000 || texts.length > 100)
      return Promise.reject(new AppError(413, 'Embedding batch is too large.', 'PROMPT_TOO_LARGE'));
    return queue(async (queueSignal) => {
      const signal = callerSignal ? AbortSignal.any([callerSignal, queueSignal]) : queueSignal;
      const attempt = async () => {
        if (Date.now() < cooldownUntil) throw rateLimitError();
        if (signal.aborted) throw new AppError(504, 'Provider request timed out.', 'PROVIDER_TIMEOUT', true);
        // Reserve for this attempt, not hypothetical retries. Reservations are not refunded,
        // including when a later cooldown or timeout prevents dispatch.
        await reserve('embedding-daily', bytes, configuredLimit('SERVER_EMBEDDING_DAILY_BYTES', 300000000), 86400000);
        // Reservations may await Redis; schedule the actual dispatch only after they settle.
        await pace(signal);
        if (signal.aborted) throw new AppError(504, 'Provider request timed out.', 'PROVIDER_TIMEOUT', true);
        return work(signal);
      };
      try {
        return await withEmbeddingRetry(attempt);
      } catch (error) {
        if (error instanceof AppError && error.code === 'EMBEDDING_RATE_LIMITED') {
          // Only a provider-originated 429 may arm/extend the cooldown; a
          // locally-raised cooldown error must preserve the existing deadline,
          // otherwise repeated retries plus ceil rounding cause indefinite outage.
          if (!isLocalCooldownError(error)) {
            const seconds = Number(error.context?.retryAfterSeconds) || 60;
            cooldownUntil = Math.max(cooldownUntil, Date.now() + seconds * 1000);
          }
        }
        throw error;
      }
    }, callerSignal);
  };
  return {
    ...provider,
    embed: (text, signal) => run([text], (s) => provider.embed(text, s), signal),
    embedBatch: (texts, signal) => run(texts, (s) => provider.embedBatch(texts, s), signal),
  };
}
