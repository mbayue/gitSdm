import { useCallback, useRef, useState } from 'react';
import { Search, Loader2, Clock } from 'lucide-react';
import { useSearchStore } from './searchStore';
import { clsx } from 'clsx';
import { TooltipHint } from '@/components/ui/tooltip';

interface SearchBarProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
}

export function SearchBar({ onSubmit, disabled }: SearchBarProps) {
  const { query, setQuery, isLoading, recentQueries } = useSearchStore();
  const [showRecent, setShowRecent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed || trimmed.length < 3) return;
      onSubmit(trimmed);
      setShowRecent(false);
    },
    [query, onSubmit],
  );

  const handleRecentClick = useCallback(
    (q: string) => {
      setQuery(q);
      onSubmit(q);
      setShowRecent(false);
    },
    [setQuery, onSubmit],
  );

  return (
    <div className="relative w-full">
      {/* Accessible label */}
      <label htmlFor="search-input" className="sr-only">
        Search codebase or ask a question
      </label>

      <form onSubmit={handleSubmit} className="relative">
        <TooltipHint content={disabled ? 'Index the repository first to enable search' : undefined}>
        <div
          tabIndex={disabled ? 0 : undefined}
          className={clsx(
            'flex items-center rounded-md border bg-background transition-all duration-200',
            disabled
              ? 'border-border opacity-60'
              : 'border-border focus-within:border-accent focus-within:ring-1 focus-within:ring-accent',
          )}
        >
          <Search className="ml-3.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => recentQueries.length > 0 && setShowRecent(true)}
            onBlur={() => setTimeout(() => setShowRecent(false), 200)}
            placeholder={useSearchStore.getState().mode === 'search' ? "Search code by meaning..." : "Ask how this repository works..."}
            maxLength={500}
            disabled={disabled || isLoading}
            className={clsx(
              'w-full bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none',
              disabled && 'cursor-not-allowed opacity-70',
            )}
          />
          {isLoading && <Loader2 className="mr-3 h-4 w-4 animate-spin text-ui-active-text-green" />}
          <button
            type="submit"
            disabled={disabled || isLoading || query.trim().length < 3}
            className={clsx(
              'mr-2 shrink-0 cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-all duration-200',
              'bg-card text-foreground border border-border hover:border-ring/50 hover:bg-secondary',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            {isLoading ? 'Searching…' : 'Go'}
          </button>
        </div>
        </TooltipHint>
      </form>

      {/* Recent queries dropdown */}
      {showRecent && recentQueries.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-card py-1 shadow-xl">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Recent
          </div>
          {recentQueries.map((q) => (
            <button
              key={q}
              onClick={() => handleRecentClick(q)}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground transition-colors duration-200 hover:bg-background"
            >
              <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{q}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
