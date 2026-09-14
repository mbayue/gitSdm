import { expect, test } from 'bun:test';
import { createAdmissionLimit, limitRequestBody, MAX_BODY_BYTES } from './request-limits';

test('a stalled body is cancelled at its deadline', async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    cancel() {
      cancelled = true;
    },
  });
  await expect(
    limitRequestBody(new Request('http://localhost/api', { method: 'POST', body }), 10),
  ).rejects.toMatchObject({ status: 408 });
  expect(cancelled).toBe(true);
});

test('admission rejects overload, releases once, and resets the time window', () => {
  let time = 0;
  const admit = createAdmissionLimit(1, 2, () => time);
  const release = admit();
  expect(release).not.toBeNull();
  expect(admit()).toBeNull();
  release?.();
  release?.();
  const second = admit();
  expect(second).not.toBeNull();
  expect(admit()).toBeNull();
  second?.();
  expect(admit()).toBeNull();
  time = 60_000;
  expect(admit()).not.toBeNull();
});

test('body limit preserves JSON at the byte boundary', async () => {
  const body = 'a'.repeat(MAX_BODY_BYTES);
  const request = await limitRequestBody(new Request('http://localhost/api', { method: 'POST', body }));
  expect(await request.text()).toBe(body);
});

test('body limit rejects streamed excess even with a false content length', async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      controller.enqueue(new Uint8Array(MAX_BODY_BYTES));
    },
    cancel() {
      cancelled = true;
    },
  });
  const request = new Request('http://localhost/api', {
    method: 'POST',
    body: stream,
    headers: { 'content-length': '1' },
  });
  await expect(limitRequestBody(request)).rejects.toMatchObject({
    status: 413,
  });
  expect(cancelled).toBe(true);
});

test('body limit counts UTF-8 bytes and rejects oversized declared lengths', async () => {
  await expect(
    limitRequestBody(
      new Request('http://localhost/api', {
        method: 'POST',
        body: 'é'.repeat(MAX_BODY_BYTES),
      }),
    ),
  ).rejects.toMatchObject({ status: 413 });
  await expect(
    limitRequestBody(
      new Request('http://localhost/api', {
        method: 'POST',
        headers: { 'content-length': String(MAX_BODY_BYTES + 1) },
      }),
    ),
  ).rejects.toMatchObject({ status: 413 });
});
