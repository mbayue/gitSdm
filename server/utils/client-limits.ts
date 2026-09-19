import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { cacheHashSecret } from '../cache/hash-secret';
import { configuredLimit, reserveUsage } from './usage-limits';

function parseDottedQuad(text: string): string | undefined {
  const dotted = text.toLowerCase().match(/^([^:]+):([^:]+):([^:]+):([^:]+)$/);
  const parts = dotted ? [dotted[1], dotted[2], dotted[3], dotted[4]] : text.includes('.') && !text.includes(':') ? text.split('.') : null;
  if (!parts || parts.length !== 4) return undefined;
  const octets: number[] = [];
  for (const part of parts) {
    const p = part.trim().toLowerCase();
    if (!/^(0[xX][0-9a-f]+|0[oO][0-7]+|0[0-7]*|[0-9]+)$/.test(p)) return undefined;
    const n = p.startsWith('0x') || p.startsWith('0X') ? parseInt(p, 16) : p.startsWith('0o') || p.startsWith('0O') ? parseInt(p.slice(2), 8) : p.length > 1 && p.startsWith('0') ? parseInt(p, 8) : parseInt(p, 10);
    if (!Number.isInteger(n) || n < 0 || n > 255) return undefined;
    octets.push(n);
  }
  return octets.join('.');
}

function parseSingleU32(text: string): string | undefined {
  const p = text.trim().toLowerCase();
  if (!/^(0[xX][0-9a-f]+|0[oO][0-7]+|0[0-7]*|[0-9]+)$/.test(p)) return undefined;
  const n = p.startsWith('0x') || p.startsWith('0X') ? parseInt(p, 16) : p.startsWith('0o') || p.startsWith('0O') ? parseInt(p.slice(2), 8) : p.length > 1 && p.startsWith('0') ? parseInt(p, 8) : parseInt(p, 10);
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) return undefined;
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

function normalize(value: string): string | undefined {
  const raw = value.trim();
  if (!raw) return undefined;
  // ponytail: parse hex/octal/decimal IPv4 forms to their 32-bit payload so forwarded
  // values cannot split buckets (0x7f.0.0.1 and 127.0.0.1 hash together).
  const quad = parseDottedQuad(raw);
  if (quad) return quad;
  const address = raw.toLowerCase();
  if (isIP(address) === 6) {
    const canonical = new URL(`http://[${address}]/`).hostname.slice(1, -1);
    const mapped = /^::ffff:([0-9a-f]+):([0-9a-f]+)$/.exec(canonical);
    if (mapped) {
      const high = parseInt(mapped[1], 16);
      const low = parseInt(mapped[2], 16);
      return [high >> 8, high & 255, low >> 8, low & 255].join('.');
    }
    return canonical;
  }
  // IPv4-mapped IPv6 must canonicalize from the embedded 32-bit payload, including
  // hex/octal forms that isIP() rejects (e.g. ::ffff:0x7f.0.0.1, ::ffff:0x7f000001).
  if (address.startsWith('::ffff:')) {
    const tail = address.slice(7);
    return parseDottedQuad(tail) ?? parseSingleU32(tail) ?? undefined;
  }
  if (!isIP(address)) return undefined;
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
  // ponytail: HMAC with the server secret (not unkeyed SHA-256) so readable Redis keys
  // do not let IPv4 enumeration recover the client mapping. Missing transport shares one bucket.
  const scope = createHmac('sha256', cacheHashSecret()).update(address).digest('hex');
  await reserveUsage(`ip-minute:${scope}`, 1, configuredLimit('API_REQUESTS_PER_IP_PER_MINUTE', 120), 60000);
}
