import { test, expect } from 'bun:test';
import { recoverIndexingStatus } from './indexing-recovery';
import type { IndexingStatus } from '@/types';
import { ApiError } from '@/lib/apiClient';

const paused: IndexingStatus = {
  state: 'paused',
  progress: 80,
  filesProcessed: 32,
  totalFiles: 40,
  snapshotSha: 'original',
  retryAt: 1000,
  reason: 'EMBEDDING_RATE_LIMITED',
  error: 'Provider limit',
  coverage: { kind: 'partial', commitSha: 'original', indexedFiles: 32, totalFiles: 40 },
};

test('network failure preserves snapshot, progress and coverage without retrying an expired timer', () => {
  const recovered = recoverIndexingStatus(paused, new ApiError('Network unavailable', 0), 2000);
  expect(recovered).toMatchObject({
    state: 'paused',
    snapshotSha: 'original',
    filesProcessed: 32,
    coverage: paused.coverage,
  });
  expect(recovered.state === 'paused' && recovered.retryAt).toBeUndefined();
});
test('admission failure uses the new retry time while preserving the paused build', () => {
  const error = Object.assign(new Error('Busy'), { status: 429, details: { retryAfterSeconds: 60 } });
  expect(recoverIndexingStatus(paused, error, 2000)).toMatchObject({
    state: 'paused',
    retryAt: 62000,
    filesProcessed: 32,
  });
});
test('terminal rejection does not advertise a discarded partial index', () => {
  expect(recoverIndexingStatus(paused, Object.assign(new Error('Too large'), { status: 413 }))).toMatchObject({
    state: 'failed',
    coverage: undefined,
  });
});
