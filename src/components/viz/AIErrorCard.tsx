import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AIErrorCardProps {
  error?: string | { error?: string; message?: string; code?: string; details?: unknown };
  message?: string;
  onRetry?: () => void;
  title?: string;
}

export function AIErrorCard({ error, message, onRetry, title = "AI Request Failed" }: AIErrorCardProps) {
  let displayMessage = message || 'An unexpected AI error occurred';
  let errorCode = '';

  if (error) {
    if (typeof error === 'string') {
      displayMessage = error;
    } else {
      displayMessage = error.error || error.message || displayMessage;
      errorCode = error.code || '';
    }
  }

  return (
    <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-4 relative overflow-hidden">
      <div className="absolute right-0 bottom-0 -z-10 h-24 w-24 rounded-full bg-red-500/5 blur-2xl" />
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-4.5 w-4.5 text-red-500/80 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <h5 className="font-semibold text-white text-xs">{title}</h5>
            {errorCode && (
              <span className="text-[9px] font-mono font-semibold bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/10 uppercase tracking-wide">
                {errorCode}
              </span>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-400 break-words font-mono bg-zinc-950/20 p-2 rounded-lg border border-red-500/5">
            {displayMessage}
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
