import { cn } from '@/lib/utils';
import { useVizStore } from '@/stores/viz-store';
import type { NodeType } from '@/types';
import { ChevronsDown, ChevronsRight, Network } from 'lucide-react';

const FILTERS: { type: NodeType; label: string }[] = [
  { type: 'folder', label: 'Folders' },
  { type: 'file', label: 'Files' },
];

const LAYOUTS = [
  { type: 'force', label: 'Organic Cluster', icon: Network },
  { type: 'LR', label: 'Horizontal Tree', icon: ChevronsRight },
  { type: 'TB', label: 'Vertical Tree', icon: ChevronsDown },
] as const;

export function FilterBar() {
  const { nodeTypeFilters, toggleNodeTypeFilter, layoutType, setLayoutType } = useVizStore();

  return (
    <div className="flex items-center justify-between border-b border-white/5 px-4 py-1.5">
      {/* Node Filters */}
      <div className="flex items-center gap-1.5">
        <span className="mr-1 select-none text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Filter:
        </span>
        {FILTERS.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => toggleNodeTypeFilter(type)}
            className={cn(
              'filter-pill rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-all duration-150',
              nodeTypeFilters.has(type)
                ? 'filter-pill-active bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30'
                : 'filter-pill-inactive bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Layout Switcher */}
      <div className="flex items-center gap-1">
        <span className="mr-1.5 select-none text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Layout:
        </span>
        <div className="flex items-center rounded-md border border-white/5 bg-zinc-950 p-0.5">
          {LAYOUTS.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => setLayoutType(type)}
              title={label}
              className={cn(
                'flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-medium transition-all duration-150',
                layoutType === type
                  ? 'bg-zinc-800 text-zinc-100 shadow'
                  : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300',
              )}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
