import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { configuredLimit, reserveUsage } from './usage-limits';

function normalize(value: string): string | undefined {
  const address = value.trim().toLowerCase();
  if (!isIP(address)) return undefined;
  if (address.startsWith('::ffff:') && isIP(address.slice(7)) === 4) return address.slice(7);
  return isIP(address) === 6 ? new URL(`http://[${address}]/`).hostname.slice(1, -1) : address;
}

/** Only explicitly configured transport peers may supply a forwarded chain. */
export function resolveClientAddress(headers: Headers, remoteAddress?: string): string {
  const peer = remoteAddress && normalize(remoteAddress);
  if (!peer) return 'unknown';
  const trusted = new Set((process.env.TRUSTED_PROXY_IPS ?? '').split(',').map(normalize).filter(Boolean));
  if (!trusted.has(peer)) return peer;
  const chain = (headers.get('x-forwarded-for') ?? '').split(',');
  let address = peer;
  for (let i = chain.length - 1; i >= 0 && trusted.has(address); i--) {
    const candidate = normalize(chain[i]);
    if (!candidate) return peer;
    address = candidate;
  }
  return address;
}

export async function limitClient(headers: Headers, remoteAddress?: string): Promise<void> {
  const address = resolveClientAddress(headers, remoteAddress);
  // Redis keys do not contain raw client addresses. Missing transport identity shares one bucket.
  const scope = createHash('sha256').update(address).digest('hex');
  await reserveUsage(`ip-minute:${scope}`, 1, configuredLimit('API_REQUESTS_PER_IP_PER_MINUTE', 120), 60000);
}
