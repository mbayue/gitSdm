import type { IncomingMessage, ServerResponse } from 'node:http';
import type { TLSSocket } from 'node:tls';
import { handleApiRequest } from '../api-router';
import { checkBodySize } from './request-limits';
import { AppError, toErrorPayload } from './errors';

/**
 * Adapter to handle Node-compatible requests (Vite dev server, Vercel)
 * and route them through the Web-standard handleApiRequest.
 */
export async function handleNodeRequest(
  nodeReq: IncomingMessage,
  nodeRes: ServerResponse,
  bodyTimeoutMs = 15000,
): Promise<boolean> {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeReq.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      } else {
        headers.set(key, value);
      }
    }
  }

  const protocol = (nodeReq.socket as TLSSocket).encrypted ? 'https' : 'http';
  const host = nodeReq.headers.host ?? 'localhost';
  const url = `${protocol}://${host}${nodeReq.url}`;

  let body: BodyInit | undefined;
  // A stalled body must abort the read without destroying the connection: the
  // race below rejects with a typed 408 while the socket stays open for the
  // error write (closed after flush in the catch block). Destroying the
  // request up front would surface a plain Error -> generic 500 instead.
  const requestTimeoutError = () => new AppError(408, 'Request body timed out.', 'REQUEST_TIMEOUT', true);
  let bodyTimer: ReturnType<typeof setTimeout> | undefined;
  const bodyDeadline = new Promise<never>((_resolve, reject) => {
    bodyTimer = setTimeout(() => reject(requestTimeoutError()), bodyTimeoutMs);
  });
  try {
    checkBodySize(Number(nodeReq.headers['content-length'] ?? 0));
    const requestWithBody = nodeReq as IncomingMessage & { body?: unknown };
    if (requestWithBody.body !== undefined) {
      const parsedBody = requestWithBody.body;
      body = typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody);
      checkBodySize(Buffer.byteLength(body));
    } else if (nodeReq.method !== 'GET' && nodeReq.method !== 'HEAD') {
      const chunks: Buffer[] = [];
      let size = 0;
      const reader = (async () => {
        for await (const chunk of nodeReq.iterator({ destroyOnReturn: false })) {
          size += Buffer.byteLength(chunk);
          checkBodySize(size);
          chunks.push(chunk as Buffer);
        }
      })();
      // Swallow the abandoned reader's late settlement; teardown happens in
      // the catch block after the error response is flushed.
      void reader.catch(() => undefined);
      await Promise.race([reader, bodyDeadline]);
      body = Buffer.concat(chunks);
    }
  } catch (error) {
    // The request stream is intentionally left unconsumed: draining an oversized body can
    // tie the connection up indefinitely. Flush the error response first, then tear down.
    const payload = toErrorPayload(error);
    const response = addSecurityHeaders(Response.json(payload, { status: payload.status }));
    nodeRes.statusCode = response.status;
    response.headers.forEach((value, key) => nodeRes.setHeader(key, value));
    nodeRes.setHeader('Connection', 'close');
    nodeRes.end(await response.text(), () => nodeReq.destroy());
    return true;
  } finally {
    clearTimeout(bodyTimer);
  }

  const webReq = new Request(url, {
    method: nodeReq.method,
    headers,
    body,
  });

  const webRes = await handleApiRequest(webReq, nodeReq.socket.remoteAddress);
  if (!webRes) {
    return false;
  }

  nodeRes.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => {
    nodeRes.setHeader(key, value);
  });

  const arrayBuffer = await webRes.arrayBuffer();
  nodeRes.end(Buffer.from(arrayBuffer));
  return true;
}

export function addSecurityHeaders(response: Response): Response {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  // X-XSS-Protection is deprecated; use CSP instead
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; script-src 'self' 'sha256-1HwijBPaKaOtZGvlT2Hw0JpmgDixxpRo6XKpkDG9xvs=' 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss:;",
  );
  return response;
}
