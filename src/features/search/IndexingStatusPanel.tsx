import { Database, AlertCircle, CheckCircle2, RefreshCw, Loader2, Zap } from 'lucide-react';
import { useSearchStore } from './searchStore';

interface IndexingStatusProps {
  onRetry?: () => void;
}

export function IndexingStatusPanel({ onRetry }: IndexingStatusProps) {
  const { indexingStatus } = useSearchStore();

  if (indexingStatus.state === 'idle') {
    return (
      <div className="flex items-center gap-3 rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[#0d1117] border border-[rgba(240,246,252,0.1)]">
          <Database className="h-4 w-4 text-[#8b949e]" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-[#e6edf3]">Index missing</p>
          <p className="text-[11px] text-[#8b949e]">Build an index to search this repository by meaning</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] px-3 py-1.5 text-[11px] font-semibold text-[#e6edf3] transition-all hover:border-[#58a6ff] hover:bg-[#58a6ff]/10 hover:text-[#58a6ff]"
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
      <div className="space-y-2.5 rounded-md border border-[#58a6ff]/30 bg-[#58a6ff]/5 px-4 py-3">
        <div className="flex items-center gap-2.5 text-xs text-[#58a6ff]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-semibold">
            {hasFileCount ? 'Indexing...' : 'Scanning repository...'}
          </span>
          {hasFileCount && (
            <span className="ml-auto font-mono text-[10px] tabular-nums text-[#58a6ff]/80">
              {indexingStatus.filesProcessed}/{indexingStatus.totalFiles} files
            </span>
          )}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#0d1117] border border-[rgba(240,246,252,0.1)]">
          <div
            className="h-full rounded-full bg-[#58a6ff] transition-all duration-500 ease-out"
            style={{ width: `${Math.max(progress, 2)}%` }}
          />
        </div>
        <p className="text-[10px] text-[#8b949e]">
          {hasFileCount
            ? 'Building semantic embeddings...'
            : 'Preparing files...'}
        </p>
      </div>
    );
  }

  if (indexingStatus.state === 'complete') {
    return (
      <div className="flex items-center gap-2.5 rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] px-4 py-3 text-xs">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#3fb950]" />
        <span className="font-semibold text-[#e6edf3]">Index ready</span>
        <span className="text-[#8b949e] font-mono ml-auto">{indexingStatus.chunkCount} chunks</span>
      </div>
    );
  }

  if (indexingStatus.state === 'failed') {
    return (
      <div className="flex items-center gap-3 rounded-md border border-[#f85149]/30 bg-[#f85149]/5 px-4 py-3">
        <AlertCircle className="h-4 w-4 shrink-0 text-[#f85149]" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#f85149]">Index failed</p>
          <p className="truncate text-[11px] text-[#f85149]/80">{indexingStatus.error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-[#f85149]/30 bg-[#f85149]/10 px-3 py-1.5 text-[11px] font-semibold text-[#f85149] transition-all hover:bg-[#f85149]/20"
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
