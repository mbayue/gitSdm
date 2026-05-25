import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AIErrorCardProps {
  message: string;
  onRetry?: () => void;
  title?: string;
}

export function AIErrorCard({ message, onRetry, title = "AI Request Failed" }: AIErrorCardProps) {
  return (
    <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-4 relative overflow-hidden">
      <div className="absolute right-0 bottom-0 -z-10 h-24 w-24 rounded-full bg-red-500/5 blur-2xl" />
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-4.5 w-4.5 text-red-500/80 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1.5 min-w-0">
          <h5 className="font-semibold text-white text-xs">{title}</h5>
          <p className="text-[11px] leading-relaxed text-zinc-400 break-words font-mono bg-zinc-950/20 p-2 rounded-lg border border-red-500/5">
            {message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-500/20 transition-all"
            >
              <RefreshCw className="h-3 w-3" />
              Retry Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
