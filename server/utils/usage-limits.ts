import { promises as dnsPromises } from 'node:dns';
import { AppError } from './errors';
import { isSafeRemoteUrl } from './url-guard';

const defaultLookup = async (hostname: string): Promise<string[]> =>
  (await dnsPromises.lookup(hostname, { all: true })).map(({ address }) => address);

export interface UsageLimitDependencies {
  fetch: typeof fetch;
  now: () => number;
  lookup?: (hostname: string) => Promise<string[]>;
  lookupTimeoutMs?: number;
}

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
  dependencies: UsageLimitDependencies = { fetch, now: Date.now, lookup: defaultLookup },
): Promise<void> {
  const now = dependencies.now();
  const lookup = dependencies.lookup ?? defaultLookup;
  const lookupTimeoutMs = dependencies.lookupTimeoutMs ?? 3000;
  const bucket = Math.floor(now / windowMs);
  const ttl = windowMs - (now % windowMs);
  const key = `gitsdm:limits:${kind}:${bucket}`;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const shared = process.env.RATE_LIMIT_MODE === 'shared' || !!url || !!token;
  let allowed: boolean;
  if (shared) {
    if (!url || !token)
      throw new AppError(503, 'Shared usage limiter is not configured.', 'LIMITER_UNAVAILABLE', true);
    if (!url.startsWith('https://') || !isSafeRemoteUrl(url))
      throw new AppError(503, 'Shared usage limiter URL is not permitted.', 'LIMITER_UNAVAILABLE', true);
    // Hostname checks cannot catch DNS rebinding: resolve and re-validate every address
    // before connecting. A small TOCTOU window between lookup and connect remains.
    let addresses: string[];
    let lookupTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      // WHATWG hostnames keep brackets on IPv6 literals; dns.lookup needs them stripped.
      // dns.promises.lookup has no deadline of its own — bound it so a hung resolver
      // cannot hold admission slots past the limiter's own request timeout.
      addresses = await Promise.race([
        lookup(new URL(url).hostname.replace(/^\[|\]$/g, '')),
        new Promise<string[]>((_, rejectLookup) => {
          lookupTimer = setTimeout(() => rejectLookup(new Error('DNS lookup timed out')), lookupTimeoutMs);
          lookupTimer.unref?.();
        }),
      ]);
    } catch {
      throw new AppError(503, 'Shared usage limiter is unavailable.', 'LIMITER_UNAVAILABLE', true);
    } finally {
      clearTimeout(lookupTimer);
    }
    if (
      !addresses.length ||
      !addresses.every((address) =>
        isSafeRemoteUrl(address.includes(':') ? `https://[${address}]` : `https://${address}`),
      )
    )
      throw new AppError(503, 'Shared usage limiter address is not permitted.', 'LIMITER_UNAVAILABLE', true);
    try {
      const response = await dependencies.fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['EVAL', script, 1, key, amount, limit, ttl]),
        redirect: 'error',
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
