import { describe, expect, test } from 'bun:test';
import { shouldApplyRender } from './render-sequence';

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

describe('shouldApplyRender sequence guard', () => {
  test('latest active render applies', () => {
    expect(shouldApplyRender(2, 2, true)).toBe(true);
  });

  test('superseded render does not apply', () => {
    expect(shouldApplyRender(1, 2, true)).toBe(false);
  });

  test('cleaned-up render does not apply even when latest', () => {
    expect(shouldApplyRender(2, 2, false)).toBe(false);
  });

  test('stale success is dropped while latest success applies', async () => {
    // Mirrors useArchitectureState: each effect bumps a monotonic sequence;
    // only the latest may publish SVG state.
    let current = 0;
    const applied: string[] = [];

    const firstSeq = ++current;
    const firstActive = true;
    const first = deferred<string>();

    const secondSeq = ++current;
    const secondActive = true;
    const second = deferred<string>();

    const firstHandler = first.promise.then((svg) => {
      if (shouldApplyRender(firstSeq, current, firstActive)) applied.push(svg);
    });
    const secondHandler = second.promise.then((svg) => {
      if (shouldApplyRender(secondSeq, current, secondActive)) applied.push(svg);
    });

    // Stale render resolves first: guard drops it.
    first.resolve('<svg>stale</svg>');
    await firstHandler;
    expect(applied).toEqual([]);

    // Latest render resolves: guard applies it.
    second.resolve('<svg>latest</svg>');
    await secondHandler;
    expect(applied).toEqual(['<svg>latest</svg>']);
  });

  test('stale rejection is dropped while latest rejection surfaces', async () => {
    // Mirrors the .catch() branch: only the latest attempt may report an
    // error/toast; superseded rejections are swallowed after DOM cleanup.
    let current = 0;
    const reported: string[] = [];

    const firstSeq = ++current;
    const first = deferred<string>();
    const secondSeq = ++current;
    const second = deferred<string>();

    const reportIfLatest = (seq: number, active: boolean) => (err: unknown) => {
      if (shouldApplyRender(seq, current, active)) {
        reported.push(err instanceof Error ? err.message : String(err));
      }
    };

    const firstHandler = first.promise.then(
      () => {},
      reportIfLatest(firstSeq, true),
    );
    const secondHandler = second.promise.then(
      () => {},
      reportIfLatest(secondSeq, true),
    );

    // Stale render rejects (e.g. its mermaid config was replaced mid-flight):
    // no misleading toast.
    first.reject(new Error('stale layout failure'));
    await firstHandler;
    expect(reported).toEqual([]);

    // Latest render rejects: error surfaces.
    second.reject(new Error('latest layout failure'));
    await secondHandler;
    expect(reported).toEqual(['latest layout failure']);
  });

  test('effect cleanup suppresses a late success', async () => {
    let current = 0;
    let active = true;
    const seq = ++current;
    const gate = deferred<string>();
    let applied: string | null = null;

    const handler = gate.promise.then((svg) => {
      if (shouldApplyRender(seq, current, active)) applied = svg;
    });

    // Teardown runs before the render settles.
    active = false;
    gate.resolve('<svg>late</svg>');
    await handler;
    expect(applied).toBeNull();
  });
});
