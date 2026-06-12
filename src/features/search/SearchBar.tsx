import { useCallback, useRef, useState } from 'react';
import { Search, Loader2, Clock } from 'lucide-react';
import { useSearchStore } from './searchStore';
import { clsx } from 'clsx';

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
        <div
          className={clsx(
            'flex items-center rounded-xl border bg-white/[0.03] backdrop-blur-sm transition-all duration-200',
            disabled
              ? 'border-white/[0.04] opacity-60'
              : 'border-white/[0.08] focus-within:border-violet-500/40 focus-within:ring-1 focus-within:ring-violet-500/20',
          )}
        >
          <Search className="ml-3.5 h-4 w-4 shrink-0 text-zinc-500" />
          <input
            ref={inputRef}
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => recentQueries.length > 0 && setShowRecent(true)}
            onBlur={() => setTimeout(() => setShowRecent(false), 200)}
            placeholder="Search codebase or ask a question…"
            maxLength={500}
            disabled={disabled || isLoading}
            title={disabled ? 'Index the repository first to enable search' : undefined}
            className={clsx(
              'w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none',
              disabled && 'cursor-not-allowed opacity-70',
            )}
          />
          {isLoading && <Loader2 className="mr-3 h-4 w-4 animate-spin text-violet-400" />}
          <button
            type="submit"
            disabled={disabled || isLoading || query.trim().length < 3}
            className={clsx(
              'mr-2 shrink-0 cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200',
              'bg-violet-600 text-white hover:bg-violet-500',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            {isLoading ? 'Searching…' : 'Go'}
          </button>
        </div>
      </form>

      {/* Recent queries dropdown */}
      {showRecent && recentQueries.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-white/[0.08] bg-zinc-900/95 py-1 shadow-xl backdrop-blur-md">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Recent
          </div>
          {recentQueries.map((q) => (
            <button
              key={q}
              onClick={() => handleRecentClick(q)}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm text-zinc-300 transition-colors duration-200 hover:bg-white/[0.04]"
            >
              <Clock className="h-3 w-3 shrink-0 text-zinc-600" />
              <span className="truncate">{q}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
