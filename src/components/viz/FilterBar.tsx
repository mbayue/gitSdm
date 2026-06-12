import { cn } from '@/lib/utils';
import { useVizStore } from '@/stores/vizStore';
import { Network, History, Share2, Users, GitFork } from 'lucide-react';

import type { RepoAnalysis } from '@/types';

const LAYOUTS = [
  { type: 'force', label: 'Organic Cluster', icon: Network },
  { type: 'network', label: 'Force Network', icon: GitFork },
] as const;

const VIEW_TABS = [
  { id: 'graph' as const, label: 'Dependency Graph', icon: Share2 },
  { id: 'architecture' as const, label: 'Architecture Diagram', icon: Network },
  { id: 'contributors' as const, label: 'Contributors', icon: Users },
  { id: 'commits' as const, label: 'Commit History', icon: History },
];

interface FilterBarProps {
  owner: string;
  repo: string;
  analysis?: RepoAnalysis;
}

export function FilterBar({ owner: _owner, repo: _repo, analysis: _analysis }: FilterBarProps) {
  const { layoutType, setLayoutType, activeView, setActiveView } = useVizStore();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 px-4 py-1.5 bg-zinc-950/20 overflow-x-auto no-scrollbar">
      {/* Left side actions (View switcher tabs) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 shrink-0">
        <div className="flex items-center gap-1 rounded-lg bg-zinc-950/40 p-0.5 border border-white/5">
          {VIEW_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveView(t.id)}
              title={t.label}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md font-medium transition-all duration-150 px-2.5 py-1 text-[10px]',
                activeView === t.id
                  ? 'bg-violet-600/15 dark:text-violet-200 text-violet-750 border border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                  : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300 border border-transparent',
              )}
            >
              <t.icon className={cn(
                'h-3 w-3',
                activeView === t.id ? 'dark:text-violet-400 text-violet-600' : ''
              )} />
              <span className="whitespace-nowrap">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Layout Switcher */}
      {activeView === 'graph' && (
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
      )}
    </div>
  );
}
