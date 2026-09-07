import { AlertCircle } from 'lucide-react';

interface CommitShaInputProps {
  shaInput: string;
  shaError: string;
  onShaInput: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onConfirm: () => void;
}

export function CommitShaInput({ shaInput, shaError, onShaInput, onKeyDown, onConfirm }: CommitShaInputProps) {
  return (
    <div className="px-1 py-1 space-y-2">
      <p className="text-xs text-muted-foreground px-1">
        Enter a full or short commit SHA (7–40 hex chars) to compare the current branch against a specific commit.
      </p>
      <div className="flex gap-1.5">
        <input
          type="text"
          placeholder="e.g. abc1234 or full SHA"
          aria-label="Commit SHA"
          value={shaInput}
          onChange={(e) => { onShaInput(e.target.value); }}
          onKeyDown={onKeyDown}
          className="flex-1 rounded-md border border-border bg-background py-1.5 px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors font-mono"
          autoFocus
        />
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-accent/10 border border-accent/20 px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors cursor-pointer shrink-0"
        >
          Compare
        </button>
      </div>
      {shaError && (
        <p className="text-xs text-destructive px-1 flex items-center gap-1" role="alert">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {shaError}
        </p>
      )}
    </div>
  );
}
