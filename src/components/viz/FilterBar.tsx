import { cn } from '@/lib/utils';
import { useVizStore } from '@/stores/viz-store';
import { ChevronsDown, ChevronsRight, Network } from 'lucide-react';

const LAYOUTS = [
  { type: 'force', label: 'Organic Cluster', icon: Network },
  { type: 'LR', label: 'Horizontal Tree', icon: ChevronsRight },
  { type: 'TB', label: 'Vertical Tree', icon: ChevronsDown },
] as const;

export function FilterBar() {
  const { layoutType, setLayoutType } = useVizStore();

  return (
    <div className="flex items-center justify-end border-b border-white/5 px-4 py-1.5">
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
