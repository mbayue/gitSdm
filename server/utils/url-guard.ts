function ipv4Forbidden([a, b, c]: number[]): boolean {
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

/** Expand an IPv6 hostname into its eight 16-bit groups; malformed forms return an empty list. */
export function expandIpv6Groups(host: string): number[] {
  const sides = host.split('::');
  if (sides.length > 2) return [];
  const head = sides[0] ? sides[0].split(':') : [];
  const tail = sides.length === 2 && sides[1] ? sides[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (sides.length === 2 ? missing <= 0 : head.length !== 8) return [];
  const pieces = sides.length === 2 ? [...head, ...Array<string>(missing).fill('0'), ...tail] : head;
  if (pieces.length !== 8 || !pieces.every((group) => /^[0-9a-fA-F]{1,4}$/.test(group))) return [];
  return pieces.map((group) => parseInt(group, 16));
}

function hostAllowed(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, '');
  if (!h) return false;
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal') || h.endsWith('.local')) return false;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    return !octets.some((octet) => octet > 255) && !ipv4Forbidden(octets);
  }
  const hostWithoutBrackets = h.replace(/^\[|\]$/g, '').split('%')[0];
  if (hostWithoutBrackets.includes(':')) {
    // Leading-zero compression only exists in ::/8 — unspecified, loopback, and the
    // IPv4-compatible/mapped forms (::127.0.0.1, ::ffff:127.0.0.1, and their hex forms).
    if (hostWithoutBrackets.startsWith('::')) return false;
    const groups = expandIpv6Groups(hostWithoutBrackets);
    if (groups.length !== 8) return false;
    if (groups[0] === 0x64 && groups[1] === 0xff9b) {
      // 64:ff9b::/96 (well-known NAT64) embeds the IPv4 destination in groups 6..7 and
      // requires groups 2..5 to be zero; every other 64:ff9b form — the local-use
      // variant 64:ff9b:1::/48 included — is reserved transition space → reject.
      if (groups[2] !== 0 || groups[3] !== 0 || groups[4] !== 0 || groups[5] !== 0) return false;
      return !ipv4Forbidden([
        (groups[6] >> 8) & 255,
        groups[6] & 255,
        (groups[7] >> 8) & 255,
        groups[7] & 255,
      ]);
    }
    if (groups[0] === 0x2002) {
      // 6to4 (2002::/16) embeds the IPv4 destination in bits 16..48 (groups 1..2) —
      // positional reads need the full expansion, not filtered groups.
      return !ipv4Forbidden([
        (groups[1] >> 8) & 255,
        groups[1] & 255,
        (groups[2] >> 8) & 255,
        groups[2] & 255,
      ]);
    }
    if (/^ff/.test(hostWithoutBrackets)) return false; // ff00::/8 multicast
    if (/^f[cd]/.test(hostWithoutBrackets)) return false; // fc00::/7 unique-local
    if (/^fe[89ab]/.test(hostWithoutBrackets)) return false; // fe80::/10 link-local
    if (hostWithoutBrackets.startsWith('2001:db8')) return false; // documentation
    return true;
  }
  // Single-label names resolve through private search domains in practice.
  return h.includes('.');
}

// ponytail: hostname-only matching cannot catch DNS rebinding (a public name resolving to a
// private IP). Ceiling named; upgrade path is an async dns.lookup re-validation of the resolved
// addresses before the fetch.
/** Trust-boundary guard for server-side outbound fetches: only http(s), and never loopback/private/reserved hosts. */
export function isSafeRemoteUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return (url.protocol === 'https:' || url.protocol === 'http:') && hostAllowed(url.hostname);
  } catch {
    return false;
  }
}
