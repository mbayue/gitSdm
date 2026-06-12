import type { IncomingMessage, ServerResponse } from 'node:http';
import type { TLSSocket } from 'node:tls';
import { handleApiRequest } from '../api-router';

/**
 * Adapter to handle Node-compatible requests (Vite dev server, Vercel)
 * and route them through the Web-standard handleApiRequest.
 */
export async function handleNodeRequest(
  nodeReq: IncomingMessage,
  nodeRes: ServerResponse,
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
  const requestWithBody = nodeReq as IncomingMessage & { body?: unknown };
  if (requestWithBody.body !== undefined) {
    const parsedBody = requestWithBody.body;
    body = typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody);
  } else if (nodeReq.method !== 'GET' && nodeReq.method !== 'HEAD') {
    const chunks: Buffer[] = [];
    for await (const chunk of nodeReq) {
      chunks.push(chunk as Buffer);
    }
    body = Buffer.concat(chunks);
  }

  const webReq = new Request(url, {
    method: nodeReq.method,
    headers,
    body,
  });

  const webRes = await handleApiRequest(webReq);
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
