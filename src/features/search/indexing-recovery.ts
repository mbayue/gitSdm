import type { IndexingStatus } from '@/types';

/** Recover a rejected request without pretending that its saved server-side build disappeared. */
export function recoverIndexingStatus(previous: IndexingStatus, error: Error, now = Date.now()): IndexingStatus {
  const status = 'status' in error && typeof error.status === 'number' ? error.status : undefined;
  const recoverable =
    status === undefined || status === 0 || status === 408 || status === 409 || status === 429 || status >= 500;
  if (previous.state === 'paused' && recoverable) {
    const details = 'details' in error ? error.details : undefined;
    const seconds =
      details && typeof details === 'object' && 'retryAfterSeconds' in details ? details.retryAfterSeconds : undefined;
    return {
      ...previous,
      error: error.message,
      retryAt:
        typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0
          ? now + Math.ceil(seconds) * 1000
          : undefined,
    };
  }
  return {
    state: 'failed',
    error: error.message,
    failedFiles: 0,
    snapshotSha: previous.snapshotSha,
    coverage: previous.coverage?.kind === 'previous' ? previous.coverage : undefined,
  };
}
