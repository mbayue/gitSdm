import { promises as dnsPromises } from 'node:dns';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { AppError } from './errors';
import { isSafeRemoteUrl } from './url-guard';

const defaultLookup = async (hostname: string): Promise<string[]> =>
  (await dnsPromises.lookup(hostname, { all: true })).map(({ address }) => address);

export interface PinnedPostArgs {
  url: string;
  token: string;
  payload: string;
  addresses: string[];
  timeoutMs: number;
}

export interface UsageLimitDependencies {
  fetch: typeof fetch;
  now: () => number;
  lookup?: (hostname: string) => Promise<string[]>;
  lookupTimeoutMs?: number;
  /** Pinned POST seam: defaults to connecting only to validated addresses (no re-resolve). */
  postJson?: (args: PinnedPostArgs) => Promise<unknown>;
}

/** Module-level override for integration tests that go through handleApiRequest (which builds its own dependencies). Production defaults to the pinned implementation. */
export const usageLimitTestHooks: { postJson?: (args: PinnedPostArgs) => Promise<unknown> } = {};

/** POST JSON to a validated address with the original TLS identity — never re-resolves DNS. */
async function postPinnedJson({ url, token, payload, addresses, timeoutMs }: PinnedPostArgs): Promise<unknown> {
  const target = new URL(url);
  const hostname = target.hostname.replace(/^\[|\]$/g, '');
  const sni = isIP(hostname) ? undefined : hostname;
  const path = `${target.pathname}${target.search}`;
  // Never replay a reservation: a lost response may follow a successful charge.
  const address = addresses[0];
  if (!address) throw new Error('No reachable limiter address');
      const text = await new Promise<string>((resolve, reject) => {
        const req = httpsRequest(
          {
            hostname: address,
            servername: sni,
            port: Number(target.port) || 443,
            path,
            method: 'POST',
            headers: {
              host: target.host,
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
              'accept-encoding': 'identity',
            },
            signal: AbortSignal.timeout(timeoutMs),
          },
          (res) => {
            const status = res.statusCode ?? 503;
            if (status >= 300 && status < 400) {
              res.resume();
              reject(new Error('Limiter redirects are not supported'));
              return;
            }
            const chunks: Buffer[] = [];
            let bytes = 0;
            res.on('data', (chunk: Buffer) => {
              bytes += chunk.length;
              if (bytes > 64 * 1024) {
                res.destroy(new Error('Limiter response exceeds size limit'));
                return;
              }
              chunks.push(chunk);
            });
            res.on('error', reject);
            res.on('end', () => {
              if (status < 200 || status >= 300) {
                reject(new Error('Limiter unavailable'));
                return;
              }
              resolve(Buffer.concat(chunks).toString('utf8'));
            });
          },
        );
        req.on('error', reject);
        req.end(payload);
      });
      return JSON.parse(text) as unknown;

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
  // ponytail: negative amounts would replenish quota via INCRBY/entry.used — fail closed.
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new AppError(400, 'Usage amount must be a non-negative integer.', 'INVALID_USAGE_AMOUNT');
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
    // Hostname checks cannot catch DNS rebinding: resolve and re-validate every address,
    // then connect only to a validated address with the original TLS identity (no re-resolve,
    // so the bearer cannot leak to a re-bound private address).
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
      const postJson = dependencies.postJson ?? usageLimitTestHooks.postJson ?? postPinnedJson;
      const result: unknown = await postJson({
        url,
        token,
        payload: JSON.stringify(['EVAL', script, 1, key, amount, limit, ttl]),
        addresses,
        timeoutMs: 3000,
      });
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
