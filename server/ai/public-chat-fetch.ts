import { lookup } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { BlockList, isIP } from 'node:net';
import { AppError } from '../utils/errors';

const blocked = new BlockList();
for (const [network, bits] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 3],
] as const) blocked.addSubnet(network, bits, 'ipv4');

export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) return !blocked.check(address, 'ipv4');
  if (isIP(address) !== 6) return false;
  const global = new BlockList();
  global.addSubnet('2000::', 3, 'ipv6');
  const special = new BlockList();
  special.addSubnet('2001::', 23, 'ipv6');
  special.addSubnet('2001:db8::', 32, 'ipv6');
  special.addSubnet('2002::', 16, 'ipv6');
  special.addSubnet('3fff::', 20, 'ipv6');
  return global.check(address, 'ipv6') && !special.check(address, 'ipv6');
}

/** Read a request body enforcing maxBytes while streaming, never materializing beyond the cap. */
export async function readBoundedBody(body: ReadableStream<Uint8Array> | null, maxBytes: number): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new AppError(413, 'AI request body is too large.', 'PROMPT_TOO_LARGE');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength)));
}

/** Resolve once and connect to the checked address, keeping the original TLS identity. */
export async function fetchPublicChat(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  return fetchPublicProvider(input, init, 256 * 1024);
}

/** A 256 KB embedding input can expand sixfold when JSON escapes control characters. */
export const EMBEDDING_REQUEST_BODY_LIMIT = 2 * 1024 * 1024;
export async function fetchPublicEmbeddings(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  return fetchPublicProvider(input, init, EMBEDDING_REQUEST_BODY_LIMIT);
}

async function fetchPublicProvider(input: string | URL | Request, init: RequestInit | undefined, maxBodyBytes: number): Promise<Response> {
  const source = new Request(input, init);
  const url = new URL(source.url);
  if (url.protocol !== 'https:' || url.username || url.password)
    throw new AppError(400, 'Use a public HTTPS AI endpoint.', 'INVALID_AI_CONFIG');
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const addresses = await Promise.race([
    lookup(hostname, { all: true, verbatim: true }),
    new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('AI endpoint DNS lookup timed out')), 5000); }),
  ]).finally(() => clearTimeout(timer));
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address)))
    throw new AppError(400, 'Local and private-network AI endpoints are not supported.', 'INVALID_AI_CONFIG');
  const MAX_BODY_BYTES = maxBodyBytes;
  const declared = Number(source.headers.get('content-length'));
  if (Number.isSafeInteger(declared) && declared > MAX_BODY_BYTES)
    throw new AppError(413, 'AI request body is too large.', 'PROMPT_TOO_LARGE');
  // Bound while reading: arrayBuffer() would materialize an unbounded body first.
  const body = await readBoundedBody(source.body, MAX_BODY_BYTES);
  const headers = Object.fromEntries(source.headers);
  headers.host = url.host;
  headers['accept-encoding'] = 'identity';
  const overallSignal = AbortSignal.any([source.signal, AbortSignal.timeout(30000)]);
  if (overallSignal.aborted) {
    throw overallSignal.reason || new Error('Request aborted');
  }
  let lastError: unknown;
  for (let i = 0; i < addresses.length; i++) {
    if (overallSignal.aborted) break;
    try {
      return await new Promise<Response>((resolve, reject) => {
        const req = httpsRequest(
          url,
          {
            hostname: addresses[i].address,
            servername: isIP(hostname) ? undefined : hostname,
            method: source.method,
            headers,
            signal: overallSignal,
          },
          (res) => {
            const chunks: Buffer[] = [];
            let bytes = 0;
            res.on('data', (chunk: Buffer) => {
              bytes += chunk.length;
              if (bytes > 10 * 1024 * 1024) {
                res.destroy(new Error('AI response exceeds size limit'));
                return;
              }
              chunks.push(chunk);
            });
            res.on('error', reject);
            res.on('end', () => {
              const status = res.statusCode ?? 502;
              if (status >= 300 && status < 400) {
                reject(new Error('AI endpoint redirects are not supported'));
                return;
              }
              const responseHeaders = new Headers();
              for (const [name, value] of Object.entries(res.headers)) {
                if (value !== undefined) responseHeaders.set(name, Array.isArray(value) ? value.join(', ') : value);
              }
              resolve(
                new Response([204, 205, 304].includes(status) ? null : Buffer.concat(chunks), {
                  status,
                  headers: responseHeaders,
                }),
              );
            });
          },
        );
        req.on('error', reject);
        req.end(body);
      });
    } catch (err) {
      lastError = err;
      const isSizeLimit = err instanceof Error && err.message === 'AI response exceeds size limit';
      const isRedirect = err instanceof Error && err.message === 'AI endpoint redirects are not supported';
      const isAppError = err instanceof AppError;
      const isConnError =
        err instanceof Error &&
        'code' in err &&
        typeof (err as { code?: unknown }).code === 'string' &&
        ['ECONNREFUSED', 'ENETUNREACH', 'EHOSTUNREACH', 'EADDRNOTAVAIL'].includes((err as { code: string }).code);

      if (overallSignal.aborted || isSizeLimit || isRedirect || isAppError || !isConnError || i === addresses.length - 1) {
        throw err;
      }
    }
  }
  throw lastError || (overallSignal.aborted ? overallSignal.reason : new Error('No reachable AI endpoint address'));
}
