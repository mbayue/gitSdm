import { useEffect, useRef, useState } from 'react';
import { useSearchStore } from './searchStore';
import { coverageMessage } from '../../../server/search/coverage';
import { formatRetryDelay } from './retry-delay';

export function IndexingStatusPanel({ onRetry, onCancel }: { onRetry?: () => void; onCancel?: () => void }) {
  const status = useSearchStore((state) => state.indexingStatus);
  const action = useSearchStore((state) => state.indexAction);
  const resumed = useRef<string | null>(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (status.state !== 'paused' || !status.retryAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [status]);
  const waiting = status.state === 'paused' && !!status.retryAt && status.retryAt > now;
  useEffect(() => {
    if (action || status.state !== 'paused' || !status.retryAt || status.retryAt > now) return;
    const deadline = `${status.snapshotSha}:${status.retryAt}`;
    if (resumed.current === deadline) return;
    resumed.current = deadline;
    onRetry?.();
  }, [status, now, onRetry, action]);
  const working = status.state === 'indexing' || status.state === 'paused';
  const button =
    'rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed';
  return (
    <section
      aria-label="Indexing status"
      className="space-y-3 rounded-md border border-border bg-card p-4 text-xs text-foreground"
    >
      <p role="status" className="font-semibold">
        {status.state === 'complete'
          ? 'Index ready'
          : status.state === 'indexing'
            ? 'Indexing repository…'
            : status.state === 'paused'
              ? 'Indexing paused'
              : status.state === 'failed'
                ? 'Index failed'
                : 'Build a search index'}
      </p>
      {working && (
        <>
          <p>
            {status.filesProcessed} files indexed · {Math.max(0, status.totalFiles - status.filesProcessed)} remaining
          </p>
          <progress
            aria-label="Files indexed"
            value={status.filesProcessed}
            max={Math.max(1, status.totalFiles)}
            className="h-2 w-full accent-accent"
          />
        </>
      )}
      {status.state === 'complete' && <p>{status.chunkCount} chunks indexed</p>}
      {(status.state === 'paused' || status.state === 'failed') && (
        <p className="text-muted-foreground">{status.error}</p>
      )}
      {status.state === 'paused' && (
        <p className="text-muted-foreground">
          {status.retryAt
            ? `Retry ${new Date(status.retryAt).toLocaleString()}${waiting ? ` (in ${formatRetryDelay(status.retryAt - now)})` : ' — ready to resume'}`
            : 'Resume when the service is available.'}
        </p>
      )}
      {status.coverage ? (
        <p>
          {working && status.coverage.kind === 'partial'
            ? 'You can search the files indexed so far.'
            : coverageMessage(status.coverage)}
        </p>
      ) : (
        working && <p>No searchable files yet. Your indexing progress will appear here.</p>
      )}
      <div className="flex gap-2">
        {status.state !== 'indexing' && status.state !== 'complete' && onRetry && (
          <button className={button} onClick={onRetry} disabled={waiting || action !== null}>
            {status.state === 'paused' ? 'Resume' : 'Build Index'}
          </button>
        )}
        {working && onCancel && (
          <button className={button} onClick={onCancel} disabled={action === 'cancel'}>
            Cancel
          </button>
        )}
      </div>
    </section>
  );
}
