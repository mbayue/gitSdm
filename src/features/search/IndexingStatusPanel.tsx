import { Database, AlertCircle, CheckCircle2, RefreshCw, Loader2, Zap } from 'lucide-react';
import { useSearchStore } from './searchStore';

interface IndexingStatusProps {
  onRetry?: () => void;
}

export function IndexingStatusPanel({ onRetry }: IndexingStatusProps) {
  const { indexingStatus } = useSearchStore();

  if (indexingStatus.state === 'idle') {
    return (
      <div className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-background border border-border">
          <Database className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">Index missing</p>
          <p className="text-[11px] text-muted-foreground">Build an index to search this repository by meaning</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[11px] font-semibold text-foreground transition-all hover:border-accent hover:bg-accent/10 hover:text-accent"
          >
            <Zap className="h-3.5 w-3.5" />
            Build Index
          </button>
        )}
      </div>
    );
  }

  if (indexingStatus.state === 'indexing') {
    const progress = indexingStatus.progress;
    const hasFileCount = indexingStatus.totalFiles > 0;
    return (
      <div className="space-y-2.5 rounded-md border border-accent/30 bg-accent/5 px-4 py-3">
        <div className="flex items-center gap-2.5 text-xs text-accent">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-semibold">
            {hasFileCount ? 'Indexing...' : 'Scanning repository...'}
          </span>
          {hasFileCount && (
            <span className="ml-auto font-mono text-[10px] tabular-nums text-accent/80">
              {indexingStatus.filesProcessed}/{indexingStatus.totalFiles} files
            </span>
          )}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-background border border-border">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${Math.max(progress, 2)}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          {hasFileCount
            ? 'Building semantic embeddings...'
            : 'Preparing files...'}
        </p>
      </div>
    );
  }

  if (indexingStatus.state === 'complete') {
    return (
      <div className="flex items-center gap-2.5 rounded-md border border-border bg-card px-4 py-3 text-xs">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
        <span className="font-semibold text-foreground">Index ready</span>
        <span className="text-muted-foreground font-mono ml-auto">{indexingStatus.chunkCount} chunks</span>
      </div>
    );
  }

  if (indexingStatus.state === 'failed') {
    return (
      <div className="flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
        <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-destructive">Index failed</p>
          <p className="truncate text-[11px] text-destructive/80">{indexingStatus.error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-[11px] font-semibold text-destructive transition-all hover:bg-destructive/20"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        )}
      </div>
    );
  }

  return null;
}
