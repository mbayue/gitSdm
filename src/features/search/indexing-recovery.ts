import type { IndexingStatus } from '@/types';

/** Untrusted provider text must never become user-facing status content. */
export function sanitizeIndexingErrorMessage(_message: string): string {
  return 'Indexing could not finish. Please retry or check your provider settings.';
}

/** Recover a rejected request without pretending that its saved server-side build disappeared. */
export function recoverIndexingStatus(previous: IndexingStatus, error: Error, now = Date.now()): IndexingStatus {
  const message = sanitizeIndexingErrorMessage(error.message);
  const status = 'status' in error && typeof error.status === 'number' ? error.status : undefined;
  const recoverable =
    status === undefined || status === 0 || status === 408 || status === 409 || status === 429 || status >= 500;
  if (previous.state === 'paused' && recoverable) {
    const details = 'details' in error ? error.details : undefined;
    const seconds =
      details && typeof details === 'object' && 'retryAfterSeconds' in details ? details.retryAfterSeconds : undefined;
    return {
      ...previous,
      error: message,
      retryAt:
        typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0
          ? now + Math.ceil(seconds) * 1000
          : undefined,
    };
  }
  return {
    state: 'failed',
    error: message,
    failedFiles: 0,
    snapshotSha: previous.snapshotSha,
    coverage: previous.coverage?.kind === 'previous' ? previous.coverage : undefined,
  };
}
