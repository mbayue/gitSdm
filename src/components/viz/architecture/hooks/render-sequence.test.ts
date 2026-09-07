import { describe, expect, test } from 'bun:test';
import { createRenderSequence } from './render-sequence';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('createRenderSequence guard', () => {
  test('latest live attempt applies', () => {
    const seq = createRenderSequence();
    const attempt = seq.start();
    expect(attempt.shouldApply()).toBe(true);
  });

  test('starting a new attempt supersedes the previous one', () => {
    const seq = createRenderSequence();
    const first = seq.start();
    seq.start();
    expect(first.shouldApply()).toBe(false);
  });

  test('abandoned attempt never applies, even when latest', () => {
    const seq = createRenderSequence();
    const attempt = seq.start();
    attempt.abandon();
    expect(attempt.shouldApply()).toBe(false);
  });

  test('sequence numbers are monotonic', () => {
    const seq = createRenderSequence();
    const a = seq.start();
    const b = seq.start();
    expect(b.seq).toBeGreaterThan(a.seq);
  });

  test('stale success is dropped while latest success applies', async () => {
    // Mirrors useArchitectureState: each effect starts an attempt on the
    // shared sequence; only the latest may publish SVG state.
    const seq = createRenderSequence();
    const applied: string[] = [];

    const first = seq.start();
    const firstGate = deferred<string>();
    const second = seq.start();
    const secondGate = deferred<string>();

    const firstHandler = firstGate.promise.then((svg) => {
      if (first.shouldApply()) applied.push(svg);
    });
    const secondHandler = secondGate.promise.then((svg) => {
      if (second.shouldApply()) applied.push(svg);
    });

    // Stale render resolves first: guard drops it.
    firstGate.resolve('<svg>stale</svg>');
    await firstHandler;
    expect(applied).toEqual([]);

    // Latest render resolves: guard applies it.
    secondGate.resolve('<svg>latest</svg>');
    await secondHandler;
    expect(applied).toEqual(['<svg>latest</svg>']);
  });

  test('stale rejection is dropped while latest rejection surfaces', async () => {
    // Mirrors the .catch() branch: only the latest attempt may report an
    // error/toast; superseded rejections are swallowed after DOM cleanup.
    const seq = createRenderSequence();
    const reported: string[] = [];

    const first = seq.start();
    const firstGate = deferred<string>();
    const second = seq.start();
    const secondGate = deferred<string>();

    const reportIfLive = (shouldApply: () => boolean) => (err: unknown) => {
      if (shouldApply()) {
        reported.push(err instanceof Error ? err.message : String(err));
      }
    };

    const firstHandler = firstGate.promise.then(
      () => {},
      reportIfLive(() => first.shouldApply()),
    );
    const secondHandler = secondGate.promise.then(
      () => {},
      reportIfLive(() => second.shouldApply()),
    );

    // Stale render rejects (e.g. its mermaid config was replaced mid-flight):
    // no misleading toast.
    firstGate.reject(new Error('stale layout failure'));
    await firstHandler;
    expect(reported).toEqual([]);

    // Latest render rejects: error surfaces.
    secondGate.reject(new Error('latest layout failure'));
    await secondHandler;
    expect(reported).toEqual(['latest layout failure']);
  });

  test('effect cleanup (abandon) suppresses a late success', async () => {
    const seq = createRenderSequence();
    const attempt = seq.start();
    const gate = deferred<string>();
    let applied: string | null = null;

    const handler = gate.promise.then((svg) => {
      if (attempt.shouldApply()) applied = svg;
    });

    // Teardown runs before the render settles.
    attempt.abandon();
    gate.resolve('<svg>late</svg>');
    await handler;
    expect(applied).toBeNull();
  });

  test('abandoning a stale attempt does not affect the latest', async () => {
    const seq = createRenderSequence();
    const first = seq.start();
    const second = seq.start();
    // Out-of-order teardowns (React StrictMode-style): stale cleanup must
    // not kill the live attempt.
    first.abandon();
    expect(second.shouldApply()).toBe(true);
    expect(first.shouldApply()).toBe(false);
  });
});
