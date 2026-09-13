import { describe, it, expect } from 'bun:test';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { addSecurityHeaders, handleNodeRequest } from './http';
import { MAX_BODY_BYTES } from './request-limits';

describe('addSecurityHeaders', () => {
  it('adds security headers to the response', () => {
    const response = new Response('ok');
    const secureResponse = addSecurityHeaders(response);

    expect(secureResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(secureResponse.headers.get('X-Frame-Options')).toBe('DENY');
    expect(secureResponse.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
    expect(secureResponse.headers.get('Content-Security-Policy')).toBe("default-src 'self'; base-uri 'self'; script-src 'self' 'sha256-1HwijBPaKaOtZGvlT2Hw0JpmgDixxpRo6XKpkDG9xvs=' 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss:;");
  });
});

/** Minimal Node req/res contract used by handleNodeRequest's body-reading path. */
function fakeNode(options: { headers?: Record<string, string>; chunks?: Buffer[] }) {
  const state = { destroyed: false, resumed: false, status: 0, headers: {} as Record<string, string> };
  const req = {
    method: 'POST',
    url: '/api/search',
    headers: options.headers ?? {},
    socket: {},
    destroy() {
      state.destroyed = true;
    },
    resume() {
      state.resumed = true;
    },
    iterator: options.chunks
      ? async function* () {
          for (const chunk of options.chunks!) yield chunk;
        }
      : undefined,
  } as unknown as IncomingMessage;
  const res = {
    get statusCode() {
      return state.status;
    },
    set statusCode(value: number) {
      state.status = value;
    },
    setHeader(key: string, value: string) {
      state.headers[key.toLowerCase()] = value;
    },
    end(_chunk?: unknown, cb?: () => void) {
      cb?.();
    },
  } as unknown as ServerResponse;
  return { req, res, state };
}

describe('handleNodeRequest body-limit teardown', () => {
  it('responds 413 to an oversized Content-Length and destroys the request instead of draining', async () => {
    const node = fakeNode({ headers: { 'content-length': String(MAX_BODY_BYTES + 1) } });
    const handled = await handleNodeRequest(node.req, node.res);

    expect(handled).toBe(true);
    expect(node.state.status).toBe(413);
    expect(node.state.headers['connection']).toBe('close');
    expect(node.state.destroyed).toBe(true);
    expect(node.state.resumed).toBe(false);
  });

  it('responds 413 when a chunked body crosses the limit mid-stream and tears the request down', async () => {
    const chunk = Buffer.alloc(200 * 1024, 1);
    const node = fakeNode({ chunks: [chunk, chunk, chunk] });
    const handled = await handleNodeRequest(node.req, node.res);

    expect(handled).toBe(true);
    expect(node.state.status).toBe(413);
    expect(node.state.headers['connection']).toBe('close');
    expect(node.state.destroyed).toBe(true);
    expect(node.state.resumed).toBe(false);
  });
});
