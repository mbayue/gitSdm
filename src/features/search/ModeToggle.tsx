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
    <div className="inline-flex rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] p-0.5" role="tablist">
      {modes.map((m) => (
        <button
          key={m.value}
          role="tab"
          aria-selected={mode === m.value}
          onClick={() => setMode(m.value)}
          className={clsx(
            'flex cursor-pointer items-center gap-1.5 rounded-sm px-3 py-1 text-xs font-medium transition-all duration-200',
            mode === m.value
              ? 'bg-[#161b22] text-[#e6edf3] shadow-sm'
              : 'text-[#8b949e] hover:text-[#e6edf3]',
          )}
        >
          {m.icon}
          {m.label}
        </button>
      ))}
    </div>
  );
}
