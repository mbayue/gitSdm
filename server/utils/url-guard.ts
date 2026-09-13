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
    const groups = hostWithoutBrackets.split(':').filter(Boolean).map((group) => parseInt(group, 16));
    if (groups[0] === 0x64 && groups[1] === 0xff9b) {
      // 64:ff9b::/96 is the well-known NAT64 prefix and 64:ff9b:1::/48 its local-use
      // variant — both transition/reserved space. /96 forms embed the IPv4 destination
      // in their low 32 bits; inputs are WHATWG-canonicalized to hex, so dotted tails
      // cannot reach this decoder and malformed groups fail closed (decode → reserved).
      if (groups.length <= 4) {
        const [hi = 0, lo = 0] = groups.slice(-2);
        return !ipv4Forbidden([(hi >> 8) & 255, hi & 255, (lo >> 8) & 255, lo & 255]);
      }
      return false;
    }
    if (/^2002:/.test(hostWithoutBrackets)) {
      // 6to4 (2002::/16) embeds the IPv4 destination in bits 16..48.
      const hi = groups[1] ?? 0;
      const lo = groups[2] ?? 0;
      return !ipv4Forbidden([(hi >> 8) & 255, hi & 255, (lo >> 8) & 255, lo & 255]);
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
