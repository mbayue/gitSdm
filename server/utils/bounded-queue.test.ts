import { test, expect } from 'bun:test';
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
