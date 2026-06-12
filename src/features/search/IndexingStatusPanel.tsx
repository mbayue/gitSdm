import { Database, AlertCircle, CheckCircle2, RefreshCw, Loader2, Zap } from 'lucide-react';
import { useSearchStore } from './searchStore';

interface IndexingStatusProps {
  onRetry?: () => void;
}

export function IndexingStatusPanel({ onRetry }: IndexingStatusProps) {
  const { indexingStatus } = useSearchStore();

  if (indexingStatus.state === 'idle') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
          <Database className="h-4 w-4 text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-amber-200">No index exists for this repository</p>
          <p className="text-[11px] text-amber-300/60">Build vector embeddings to enable semantic search</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 transition-all duration-200 hover:border-violet-500/50 hover:bg-violet-500/20 hover:text-violet-200"
          >
            <Zap className="h-3.5 w-3.5" />
            Index Now
          </button>
        )}
      </div>
    );
  }

  if (indexingStatus.state === 'indexing') {
    const progress = indexingStatus.progress;
    const hasFileCount = indexingStatus.totalFiles > 0;
    return (
      <div className="space-y-2.5 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
        <div className="flex items-center gap-2.5 text-xs text-violet-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-medium">
            {hasFileCount ? 'Indexing repository…' : 'Scanning repository…'}
          </span>
          {hasFileCount && (
            <span className="ml-auto font-mono text-[10px] tabular-nums text-violet-400">
              {indexingStatus.filesProcessed}/{indexingStatus.totalFiles} files
            </span>
          )}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(progress, 2)}%` }}
          />
        </div>
        <p className="text-[10px] text-violet-400/60">
          {hasFileCount
            ? 'This may take a moment for large repositories'
            : 'Counting files and preparing embeddings…'}
        </p>
      </div>
    );
  }

  if (indexingStatus.state === 'complete') {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-300">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
        <span className="font-medium">Index ready</span>
        <span className="text-emerald-400/60">— {indexingStatus.chunkCount} chunks indexed</span>
      </div>
    );
  }

  if (indexingStatus.state === 'failed') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
        <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-red-300">Indexing failed</p>
          <p className="truncate text-[11px] text-red-400/60">{indexingStatus.error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/20"
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
