import { test, expect } from 'bun:test';
import { createIndexRequests } from './index-requests';
import { indexRequestKey } from './index-identity';

test('a cancelled build ID cannot start and completed registrations release capacity', () => {
  const registry = createIndexRequests(Date.now, 1);
  registry.cancel('early');
  const early = registry.begin('early');
  expect(early.cancelled()).toBe(true);
  early.finish(false, false);
  const next = registry.begin('next');
  expect(next.cancelled()).toBe(false);
  next.finish();
  expect(registry.begin('another').cancelled()).toBe(false);
});
test('late cancellation of an old attempt cannot cancel its replacement', () => {
  const registry = createIndexRequests();
  let cancelled = 0;
  const old = registry.begin('old');
  old.attach('snapshot', () => {
    cancelled++;
  });
  old.finish(true);
  const current = registry.begin('current');
  current.attach('snapshot', () => {
    cancelled++;
  });
  registry.cancel('old');
  expect(cancelled).toBe(0);
  registry.cancel('current');
  expect(cancelled).toBe(1);
});
test('cancellation identities isolate credentials and repositories', () => {
  const first = indexRequestKey('owner', 'repo', 'id', { gitHubToken: 'a' });
  expect(first).not.toBe(indexRequestKey('owner', 'repo', 'id', { gitHubToken: 'b' }));
  expect(first).not.toBe(indexRequestKey('owner', 'another', 'id', { gitHubToken: 'a' }));
});

test('a failed Resume metadata lookup retains cancellation of the saved build', () => {
  const registry = createIndexRequests();
  let cancelled = false;
  const first = registry.begin('build');
  first.attach('snapshot', () => {
    cancelled = true;
  });
  first.finish(true);
  registry.begin('build').finish(); // Metadata failed before reattaching to the pipeline.
  registry.cancel('build');
  expect(cancelled).toBe(true);
});

test('unknown cancellations and cancelled builds do not reserve indexing capacity', () => {
  const registry = createIndexRequests(Date.now, 1);
  for (let i = 0; i < 300; i++) registry.cancel(`unknown-${i}`);
  const build = registry.begin('legitimate');
  build.attach('snapshot', () => {});
  build.finish(true);
  registry.cancel('legitimate');
  expect(registry.begin('next').cancelled()).toBe(false);
});

test('early cancellation expires after the bounded arrival window', () => {
  let now = 1000;
  const registry = createIndexRequests(() => now);
  registry.cancel('early');
  const early = registry.begin('early');
  expect(early.cancelled()).toBe(true);
  early.finish();
  now += 2 * 60 * 1000 + 1;
  expect(registry.begin('early').cancelled()).toBe(false);
});
