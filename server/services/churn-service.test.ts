import { test, expect } from 'bun:test';
import { Octokit } from '@octokit/rest';
import { fetchRepoChurn } from './churn-service';
import { clearAllCaches } from '../cache/lru';

test('successful empty histories count as checked and batches resume without repeating files', async () => {
  clearAllCaches();
  let calls = 0;
  const octokit = new Octokit({
    request: {
      fetch: async () => {
        calls++;
        return Response.json([]);
      },
    },
  });
  const paths = Array.from({ length: 10 }, (_, i) => `${i}.ts`);
  const first = await fetchRepoChurn('owner', 'repo', paths, 'sha', {
    octokit,
  });
  expect(first.checked).toBe(7);
  expect(first.complete).toBe(false);
  expect(first.files['0.ts'].commitCount).toBe(0);
  expect(first.files['0.ts'].lastModified).toBeUndefined();
  const second = await fetchRepoChurn('owner', 'repo', paths, 'sha', {
    octokit,
  });
  expect(second.checked).toBe(10);
  expect(second.complete).toBe(true);
  expect(calls).toBe(10);
  await fetchRepoChurn('owner', 'repo', paths, 'sha', { octokit });
  expect(calls).toBe(10);
});

test('partial results survive failure and cooldown prevents immediate retry', async () => {
  clearAllCaches();
  let calls = 0;
  const octokit = new Octokit({
    request: {
      fetch: async () => {
        calls++;
        return calls === 2
          ? Response.json({ message: 'limited' }, { status: 429, headers: { 'retry-after': '120' } })
          : Response.json([]);
      },
    },
    log: { debug() {}, info() {}, warn() {}, error() {} },
  });
  const paths = ['a.ts', 'b.ts', 'c.ts'];
  const result = await fetchRepoChurn('owner', 'repo', paths, 'sha', {
    octokit,
  });
  expect(result.checked).toBe(2);
  expect(result.issue).toBe('rate-limit');
  expect(result.files['b.ts']).toBeUndefined();
  expect(result.retryAt).toBeGreaterThan(Date.now() + 110000);
  await fetchRepoChurn('owner', 'repo', paths, 'sha', { octokit });
  expect(calls).toBe(3);
  const other = await fetchRepoChurn('owner', 'repo', paths, 'other-sha', {
    octokit,
  });
  expect(other.complete).toBe(true);
  expect(calls).toBe(6);
});

test('concurrent cold requests share in-flight work', async () => {
  clearAllCaches();
  let calls = 0;
  const octokit = new Octokit({
    request: {
      fetch: async () => {
        calls++;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return Response.json([]);
      },
    },
  });
  const run = () => fetchRepoChurn('owner', 'concurrent', ['a.ts', 'b.ts'], 'sha', { octokit });
  const results = await Promise.all([run(), run()]);
  expect(calls).toBe(2);
  expect(results.map((result) => result.checked)).toEqual([2, 2]);
});

test('credential-specific failures do not block another caller', async () => {
  clearAllCaches();
  const failed = new Octokit({
    request: {
      fetch: async () => Response.json({ message: 'Forbidden' }, { status: 403 }),
    },
    log: { debug() {}, info() {}, warn() {}, error() {} },
  });
  const good = new Octokit({
    request: { fetch: async () => Response.json([]) },
  });
  expect(
    (
      await fetchRepoChurn('owner', 'scope', ['a.ts'], 'sha', {
        octokit: failed,
        gitHubToken: 'test-limited',
      })
    ).issue,
  ).toBe('access');
  expect(
    (
      await fetchRepoChurn('owner', 'scope', ['a.ts'], 'sha', {
        octokit: good,
        gitHubToken: 'test-valid',
      })
    ).complete,
  ).toBe(true);
});

test('explicit continuation resumes after losing server cache', async () => {
  clearAllCaches();
  let calls = 0;
  const octokit = new Octokit({
    request: {
      fetch: async () => {
        calls++;
        return Response.json([]);
      },
    },
  });
  const paths = Array.from({ length: 10 }, (_, i) => `${i}.ts`);
  const first = await fetchRepoChurn('owner', 'cold', paths, 'sha', {
    octokit,
  });
  clearAllCaches();
  const second = await fetchRepoChurn('owner', 'cold', paths, 'sha', { octokit }, 90, {
    completed: Object.keys(first.files),
    pending: first.remaining,
  });
  expect(second.complete).toBe(true);
  expect(calls).toBe(10);
});

test('failed first batch does not prevent checking later files', async () => {  clearAllCaches();
  let calls = 0;
  const octokit = new Octokit({
    request: {
      fetch: async () => {
        calls++;
        return calls <= 7 ? Response.json({ message: 'Unavailable' }, { status: 500 }) : Response.json([]);
      },
    },
    log: { debug() {}, info() {}, warn() {}, error() {} },
  });
  const paths = Array.from({ length: 10 }, (_, i) => `${i}.ts`);
  await fetchRepoChurn('owner', 'later', paths, 'sha', { octokit });
  const second = await fetchRepoChurn('owner', 'later', paths, 'sha', {
    octokit,
  });
  expect(second.checked).toBe(3);
  expect(second.files['7.ts']).toBeDefined();
});

test('stale continuation from another credential is refetched, not trusted', async () => {
  clearAllCaches();
  const octokit = new Octokit({
    request: { fetch: async () => Response.json([]) },
  });
  const paths = ['a.ts', 'b.ts', 'c.ts'];
  const first = await fetchRepoChurn('owner', 'rescope', paths, 'sha', {
    octokit,
    gitHubToken: 'token-a',
  });
  expect(first.complete).toBe(true);
  expect(first.scope).toBeDefined();
  clearAllCaches();
  let calls = 0;
  const counting = new Octokit({
    request: {
      fetch: async () => {
        calls++;
        return Response.json([]);
      },
    },
  });
  const second = await fetchRepoChurn('owner', 'rescope', paths, 'sha', {
    octokit: counting,
    gitHubToken: 'token-b',
  }, 90, { completed: Object.keys(first.files), scope: first.scope });
  expect(calls).toBe(3);
  expect(second.complete).toBe(true);
  expect(Object.keys(second.files)).toHaveLength(3);
});

test('login and git author name count as one contributor', async () => {
  clearAllCaches();
  const octokit = new Octokit({
    request: {
      fetch: async () =>
        Response.json([
          {
            author: { login: 'octocat' },
            commit: { author: { name: 'Mona Octocat', date: '2026-01-01T00:00:00Z' } },
          },
        ]),
    },
  });
  const result = await fetchRepoChurn('owner', 'authors', ['a.ts'], 'sha', { octokit });
  expect(result.files['a.ts'].authorCount).toBe(1);
});
test('per-file 404 does not halt the batch as a repo-wide access failure', async () => {
  clearAllCaches();
  const octokit = new Octokit({
    request: {
      fetch: async (input: RequestInfo | URL) =>
        String(input).includes('path=missing.ts')
          ? Response.json({ message: 'Not Found' }, { status: 404 })
          : Response.json([]),
    },
    log: { debug() {}, info() {}, warn() {}, error() {} },
  });
  const result = await fetchRepoChurn('owner', 'notfound', ['missing.ts', 'b.ts'], 'sha', { octokit });
  expect(result.issue).toBe('timeout-or-network');
  expect(result.complete).toBe(false);
  expect(result.remaining).toEqual(['missing.ts']);
  expect(result.files['b.ts']).toBeDefined();
});
