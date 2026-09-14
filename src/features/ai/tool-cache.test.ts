import { test, expect } from 'bun:test';
import { MutationObserver, QueryClient } from '@tanstack/query-core';
import { createCachedTask } from './tool-cache';

test('tool completion survives unmount and a new observer joins the pending work', async () => {
  const cache = new Map<string, string>();
  const run = createCachedTask(cache);
  let release = (_value: string) => {};
  const held = new Promise<string>((resolve) => { release = resolve; });
  let calls = 0;
  const options = { mutationFn: () => run('branch-a', () => { calls++; return held; }) };
  const client = new QueryClient();
  const first = new MutationObserver(client, options);
  const unsubscribe = first.subscribe(() => {});
  const request = first.mutate();
  unsubscribe();
  const second = new MutationObserver(client, options);
  const joined = second.mutate();
  release('complete');
  expect(await request).toBe('complete');
  expect(await joined).toBe('complete');
  expect(cache.get('branch-a')).toBe('complete');
  expect(calls).toBe(1);
});

test('failed work releases its key for retry', async () => {
  const run = createCachedTask(new Map<string, string>());
  await expect(run('a', async () => { throw new Error('failed'); })).rejects.toThrow('failed');
  expect(await run('a', async () => 'retried')).toBe('retried');
});

test('max <= 0 does not store entries in cache', async () => {
  const cache = new Map<string, string>();
  const run = createCachedTask(cache, 0);
  const result = await run('key-1', async () => 'data-1');
  expect(result).toBe('data-1');
  expect(cache.size).toBe(0);
});
