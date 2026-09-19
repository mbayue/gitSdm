import { expect, test } from 'bun:test';
import { isPublicAddress, fetchPublicChat, readBoundedBody, EMBEDDING_REQUEST_BODY_LIMIT } from './public-chat-fetch';

test('embedding transport admits escaped input while retaining a strict body limit', async () => {
  const body = JSON.stringify({ input: Array.from({ length: 32 }, () => '\u0000'.repeat(8000)) });
  const request = new Request('https://example.com', { method: 'POST', body });
  expect((await readBoundedBody(request.body, EMBEDDING_REQUEST_BODY_LIMIT)).length).toBe(Buffer.byteLength(body));
  const oversized = new Request('https://example.com', { method: 'POST', body: 'x'.repeat(EMBEDDING_REQUEST_BODY_LIMIT + 1) });
  await expect(readBoundedBody(oversized.body, EMBEDDING_REQUEST_BODY_LIMIT)).rejects.toMatchObject({ code: 'PROMPT_TOO_LARGE' });
});

test('blocks local, private, reserved and mapped network addresses', () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '172.16.0.1', '192.168.1.1', '100.64.0.1', '0.0.0.0', '224.0.0.1', '::1', '::ffff:127.0.0.1', 'fc00::1', 'fe80::1', '2002:7f00:1::', '2001:db8::1']) expect(isPublicAddress(address)).toBe(false);
  expect(isPublicAddress('8.8.8.8')).toBe(true);
  expect(isPublicAddress('2606:4700:4700::1111')).toBe(true);
});

test('rejects a private endpoint before sending a request', async () => {
  await expect(fetchPublicChat('https://127.0.0.1/v1')).rejects.toMatchObject({ code: 'INVALID_AI_CONFIG' });
});

test('rejects oversized request bodies before opening a connection', async () => {
  const big = new Request('https://8.8.8.8/v1', { method: 'POST', body: 'x'.repeat(256 * 1024 + 1) });
  await expect(fetchPublicChat(big)).rejects.toMatchObject({ code: 'PROMPT_TOO_LARGE' });
});

test('enforces the request-size limit while streaming chunked bodies', async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('x'.repeat(128 * 1024)));
      controller.enqueue(new TextEncoder().encode('x'.repeat(128 * 1024 + 1)));
      controller.close();
    },
  });
  const chunked = new Request('https://8.8.8.8/v1', { method: 'POST', body: stream, duplex: 'half' });
  await expect(fetchPublicChat(chunked)).rejects.toMatchObject({ code: 'PROMPT_TOO_LARGE' });
});
