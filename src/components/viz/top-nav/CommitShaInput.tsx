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
      <p className="text-[10px] text-[#8b949e] px-1">
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
          className="flex-1 rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] py-1.5 px-2.5 text-xs text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/50 transition-colors font-mono"
          autoFocus
        />
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-[#58a6ff]/10 border border-[#58a6ff]/20 px-2.5 py-1.5 text-[11px] font-medium text-[#58a6ff] hover:bg-[#58a6ff]/20 transition-colors cursor-pointer shrink-0"
        >
          Compare
        </button>
      </div>
      {shaError && (
        <p className="text-[10px] text-red-400 px-1 flex items-center gap-1" role="alert">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {shaError}
        </p>
      )}
    </div>
  );
}
