import { test, expect, spyOn } from 'bun:test';
import { createBoundedQueue } from './bounded-queue';

test('queue rejects overflow and runs queued work after a slot is released', async () => {
  const queue = createBoundedQueue(1, 1, 1000, 1000);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const first = queue(async () => {
    await gate;
    return 1;
  });
  const second = queue(async () => 2);
  await expect(queue(async () => 3)).rejects.toMatchObject({ status: 429 });
  release();
  expect(await first).toBe(1);
  expect(await second).toBe(2);
});

test('expired waiting jobs never execute', async () => {
  const queue = createBoundedQueue(1, 1, 10, 1000);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const first = queue(async () => {
    await gate;
  });
  let ran = false;
  await expect(
    queue(async () => {
      ran = true;
    }),
  ).rejects.toMatchObject({ status: 429 });
  release();
  await first;
  expect(ran).toBe(false);
});

test('execution deadline aborts but does not release a still-running operation', async () => {
  const queue = createBoundedQueue(1, 0, 1000, 10);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let signal: AbortSignal | undefined;
  const first = queue(async (current) => {
    signal = current;
    await gate;
  });
  await expect(first).rejects.toMatchObject({ status: 504 });
  expect(signal?.aborted).toBe(true);
  await expect(queue(async () => {})).rejects.toMatchObject({ status: 429 });
  release();
});

test('caller signal aborts and removes waiting job immediately', async () => {
  const queue = createBoundedQueue(1, 4, 10000, 30000);
  let release = () => {};
  const held = new Promise<void>((r) => { release = r; });
  const first = queue(() => held);

  const controller = new AbortController();
  const second = queue(() => Promise.resolve('second'), controller.signal);

  controller.abort();
  await expect(second).rejects.toThrow();

  release();
  await first;
});

test('caller signal aborts running job, aborts work signal, rejects caller immediately, and retains slot until work settles', async () => {
  const queue = createBoundedQueue(1, 0, 10000, 30000);
  let releaseWork = () => {};
  const workHeld = new Promise<void>((r) => { releaseWork = r; });
  let workSignal: AbortSignal | undefined;

  const controller = new AbortController();
  const job = queue(async (sig) => {
    workSignal = sig;
    await workHeld;
    return 'done';
  }, controller.signal);

  await new Promise((r) => setTimeout(r, 5));
  expect(workSignal).toBeDefined();
  expect(workSignal?.aborted).toBe(false);

  controller.abort(new Error('caller cancelled'));

  await expect(job).rejects.toThrow('caller cancelled');
  expect(workSignal?.aborted).toBe(true);

  await expect(queue(async () => 'next')).rejects.toMatchObject({ status: 429 });

  releaseWork();
  await new Promise((r) => setTimeout(r, 10));

  const nextJob = await queue(async () => 'free');
  expect(nextJob).toBe('free');
});

test('abort right after queue() never invokes work and releases the slot', async () => {
  const queue = createBoundedQueue(1, 0, 1000, 30000);
  const controller = new AbortController();
  let ran = false;
  const job = queue(async () => {
    ran = true;
    return 'x';
  }, controller.signal);
  controller.abort(new Error('too late'));
  await expect(job).rejects.toThrow('too late');
  await new Promise((r) => setTimeout(r, 10));
  expect(ran).toBe(false);
  expect(await queue(async () => 'free')).toBe('free');
});

test('runMs deadline detaches the caller-abort listener even when work never settles', async () => {
  const queue = createBoundedQueue(1, 0, 1000, 10);
  const controller = new AbortController();
  const addSpy = spyOn(controller.signal, 'addEventListener');
  const removeSpy = spyOn(controller.signal, 'removeEventListener');
  const hung = queue(() => new Promise<never>(() => {}), controller.signal);
  await expect(hung).rejects.toMatchObject({ status: 504 });
  const registered = addSpy.mock.calls.find(([type]) => type === 'abort')?.[1];
  expect(registered).toBeTypeOf('function');
  expect(removeSpy).toHaveBeenCalledWith('abort', registered);
  removeSpy.mockRestore();
  addSpy.mockRestore();
});
