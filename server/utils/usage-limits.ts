import { AppError } from './errors';

const local = new Map<string, { used: number; expires: number }>();
const script = `local n = tonumber(redis.call('GET', KEYS[1]) or '0')
if n + tonumber(ARGV[1]) > tonumber(ARGV[2]) then return 0 end
redis.call('INCRBY', KEYS[1], ARGV[1])
redis.call('PEXPIRE', KEYS[1], ARGV[3])
return 1`;

export function configuredLimit(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0)
    throw new AppError(503, 'Invalid usage limit configuration.', 'LIMIT_CONFIG_INVALID');
  return value;
}

/** Atomic fixed-window reservations; failures are not refunded because providers may have charged. */
export async function reserveUsage(
  kind: string,
  amount: number,
  limit: number,
  windowMs: number,
  dependencies = { fetch, now: Date.now },
): Promise<void> {
  const now = dependencies.now();
  const bucket = Math.floor(now / windowMs);
  const ttl = windowMs - (now % windowMs);
  const key = `gitsdm:limits:${kind}:${bucket}`;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const shared = process.env.RATE_LIMIT_MODE === 'shared' || !!url || !!token;
  let allowed: boolean;
  if (shared) {
    if (!url || !token || !url.startsWith('https://'))
      throw new AppError(503, 'Shared usage limiter is not configured.', 'LIMITER_UNAVAILABLE', true);
    try {
      const response = await dependencies.fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['EVAL', script, 1, key, amount, limit, ttl]),
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) throw new Error('Limiter unavailable');
      const result: unknown = await response.json();
      if (
        !result ||
        typeof result !== 'object' ||
        !('result' in result) ||
        (result.result !== 0 && result.result !== 1)
      )
        throw new Error('Invalid limiter response');
      allowed = result.result === 1;
    } catch {
      throw new AppError(503, 'Shared usage limiter is unavailable.', 'LIMITER_UNAVAILABLE', true);
    }
  } else {
    for (const [id, entry] of local) if (entry.expires <= now) local.delete(id);
    // Never evict live counters: doing so would let identity churn reset quotas.
    if (!local.has(key) && local.size >= 10000)
      throw new AppError(503, 'Usage limiter is at capacity. Please retry shortly.', 'LIMITER_UNAVAILABLE', true);
    const entry = local.get(key) ?? { used: 0, expires: now + ttl };
    allowed = entry.used + amount <= limit;
    if (allowed) {
      entry.used += amount;
      local.set(key, entry);
    }
  }
  if (!allowed)
    throw new AppError(429, 'Usage limit reached. Please retry after the limit resets.', 'USAGE_LIMIT_EXCEEDED', true, {
      retryAfterSeconds: Math.ceil(ttl / 1000),
    });
}
