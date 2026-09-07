import { Search, MessageSquare } from 'lucide-react';
import { useSearchStore } from './searchStore';
import type { SearchMode } from './searchStore';
import { clsx } from 'clsx';

export function ModeToggle() {
  const { mode, setMode } = useSearchStore();

  const modes: { value: SearchMode; label: string; icon: React.ReactNode }[] = [
    { value: 'search', label: 'Search', icon: <Search className="h-3.5 w-3.5" /> },
    { value: 'ask', label: 'Ask', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="inline-flex rounded-md border border-border bg-background p-0.5" role="tablist">
      {modes.map((m) => (
        <button
          key={m.value}
          role="tab"
          aria-selected={mode === m.value}
          onClick={() => setMode(m.value)}
          className={clsx(
            'flex cursor-pointer items-center gap-1.5 rounded-sm px-3 py-1 text-xs font-medium transition-all duration-200',
            mode === m.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {m.icon}
          {m.label}
        </button>
      ))}
    </div>
  );
}
