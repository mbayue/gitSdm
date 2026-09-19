import { randomBytes } from 'node:crypto';
import { AppError } from '../utils/errors';

const processSecret = randomBytes(32).toString('hex');

/** Read lazily: server environment loading can happen after module imports. */
export function cacheHashSecret(env: Record<string, string | undefined> = process.env): string {
  const configured = env.TOKEN_CACHE_HASH_SECRET?.trim();
  if (configured) return configured;
  const shared = env.RATE_LIMIT_MODE === 'shared' || !!env.UPSTASH_REDIS_REST_URL || !!env.UPSTASH_REDIS_REST_TOKEN;
  if (shared) throw new AppError(503, 'TOKEN_CACHE_HASH_SECRET is required in shared mode.', 'CACHE_SECRET_REQUIRED');
  return processSecret;
}
