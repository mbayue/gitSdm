import { test, expect } from 'bun:test';
import { recoverIndexingStatus, sanitizeIndexingErrorMessage } from './indexing-recovery';
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

test('unknown credentials and provider response fragments never reach the banner', () => {
  for (const message of ['Invalid key: AIza' + 'x'.repeat(35), 'Provider response: confidential source code']) {
    expect(sanitizeIndexingErrorMessage(message)).toBe('Indexing could not finish. Please retry or check your provider settings.');
  }
});

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
test('error messages are sanitized before reaching the status banner', () => {
  expect(sanitizeIndexingErrorMessage('fetch https://api.example.com/embed?key=abc failed')).not.toContain('https://');
  expect(sanitizeIndexingErrorMessage('token ghp_abcDEF1234567890 leaked')).not.toContain('ghp_abcDEF1234567890');
  const recovered = recoverIndexingStatus(paused, Object.assign(new Error('boom https://evil.example/x'), { status: 413 }));
  expect(recovered.error).not.toContain('https://');
});
