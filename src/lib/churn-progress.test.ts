import { expect, test } from 'bun:test';
import { mergeChurn, pendingChurn, churnInterval } from './churn-progress';
import type { ChurnResponse } from '@/types/churn';
const first: ChurnResponse = {
  files: { a: { commitCount: 2, authorCount: 1, churnScore: 1 } },
  checked: 1,
  total: 3,
  complete: false,
  remaining: ['b', 'c'],
  failures: {},
};
test('responses from fresh instances accumulate without losing prior successes', () => {
  const result = mergeChurn(first, {
    ...first,
    files: { b: { commitCount: 4, authorCount: 1, churnScore: 1 } },
    remaining: ['c'],
  });
  expect(result.checked).toBe(2);
  expect(result.files.a.churnScore).toBe(0.5);
  expect(result.remaining).toEqual(['c']);
});
test('failed files do not starve unchecked files and rate limits schedule recovery', () => {
  const failed: ChurnResponse = {
    ...first,
    failures: { b: { issue: 'timeout-or-network', retryAt: 2000 } },
    issue: 'timeout-or-network',
    retryAt: 2000,
  };
  expect(pendingChurn(failed, 1000)).toEqual(['c']);
  expect(pendingChurn(failed, 3000)).toEqual(['c', 'b']);
  expect(churnInterval({ ...failed, issue: 'rate-limit' }, 1000)).toBe(1500);
  expect(churnInterval({ ...first, complete: true })).toBe(false);
});
test('per-file access failures do not halt polling for the remaining batch', () => {
  // 'b' failed access but 'c' was never attempted: keep polling instead of halting.
  expect(churnInterval({ ...first, issue: 'access', remaining: ['b', 'c'], failures: {} }, 1000)).toBe(1500);
  expect(
    churnInterval(
      {
        ...first,
        issue: 'access',
        remaining: ['b'],
        failures: { b: { issue: 'access', retryAt: 5000 } },
      },
      1000,
    ),
  ).toBe(false);
});
test('merged batches keep the latest credential scope so continuations stay scoped', () => {
  const result = mergeChurn({ ...first, scope: 'scope-a' }, { ...first, scope: 'scope-b', remaining: [] });
  expect(result.scope).toBe('scope-b');
});
