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
    <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="font-semibold text-foreground text-xs">{title}</h5>
            {errorCode && (
              <span className="text-xs font-mono font-semibold bg-red-500/10 text-destructive px-1.5 py-0.5 rounded border border-red-500/10 uppercase tracking-wide">
                {errorCode}
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground break-words">
            {displayMessage}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-accent"
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
