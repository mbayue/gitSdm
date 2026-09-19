import { test, expect } from 'bun:test';
import { MutationObserver, QueryClient } from '@tanstack/query-core';
import { createCachedTask, getToolKey, mermaidCache, runMermaid } from './tool-cache';

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

test('runMermaid shares pending work and caches by key', async () => {
  const key = getToolKey('mermaid', 'o', 'mermaid-dedupe', 7);
  let calls = 0;
  const first = runMermaid(key, async () => { calls++; return { diagram: 'graph TD', cached: false }; });
  const second = runMermaid(key, async () => { calls++; return { diagram: 'graph TD', cached: false }; });
  expect(await first).toEqual(await second);
  expect(calls).toBe(1);
  expect(mermaidCache.get(key)).toEqual({ diagram: 'graph TD', cached: false });
});
test('a branch literally named default does not collide with an omitted branch', () => {
  expect(getToolKey('refactor', 'o', 'r', 1, 'default')).not.toBe(getToolKey('refactor', 'o', 'r', 1));
  expect(getToolKey('refactor', 'o', 'r', 1, undefined)).toBe(getToolKey('refactor', 'o', 'r', 1, null));
});

test('Mermaid results are separate for different commits on the same branch', async () => {
  const first = getToolKey('mermaid', 'o', 'snapshot-test', 1, 'main', 'sha-a');
  const second = getToolKey('mermaid', 'o', 'snapshot-test', 1, 'main', 'sha-b');
  await runMermaid(first, async () => ({ diagram: 'graph TD; A', cached: false }));
  expect(await runMermaid(second, async () => ({ diagram: 'graph TD; B', cached: false })))
    .toMatchObject({ diagram: 'graph TD; B' });
});
