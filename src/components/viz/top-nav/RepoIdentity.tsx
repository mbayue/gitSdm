import { Link } from 'react-router-dom';
import { GitBranch, ChevronDown, Share2, Network, Users, History, Check } from 'lucide-react';
import { useVizStore } from '@/stores/vizStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface RepoIdentityProps {
  owner: string;
  repoName: string;
}

const VIEW_TABS = [
  { id: 'graph' as const, label: 'Dependency Graph', icon: Share2 },
  { id: 'architecture' as const, label: 'Architecture', icon: Network },
  { id: 'contributors' as const, label: 'Contributors', icon: Users },
  { id: 'commits' as const, label: 'Commits', icon: History },
];

export function RepoIdentity({ owner, repoName }: RepoIdentityProps) {
  const { activeView, setActiveView } = useVizStore();

  const currentTab = VIEW_TABS.find((t) => t.id === activeView) || VIEW_TABS[0];

  return (
    <div className="flex items-center gap-2.5 min-w-0 select-none">
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 hover:border-violet-500/35 transition-all shadow-sm">
          <GitBranch className="h-4 w-4" />
        </div>
      </Link>

      <div className="flex items-center text-xs font-mono min-w-0">
        <span className="text-zinc-500 truncate font-medium max-w-[100px] sm:max-w-none">
          {owner}
        </span>
        <span className="mx-1.5 text-zinc-700 font-sans font-light">/</span>
        <span className="text-zinc-200 font-bold truncate max-w-[120px] sm:max-w-none">
          {repoName}
        </span>
      </div>

      <span className="text-zinc-800 font-sans font-light">/</span>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 h-6 px-2.5 rounded-md text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-white/[0.04] transition-all outline-none cursor-pointer">
          <currentTab.icon className="h-3.5 w-3.5 text-violet-400 shrink-0" />
          <span className="hidden sm:inline font-sans">{currentTab.label}</span>
          <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={6} className="w-52 bg-zinc-950 border-white/10 shadow-2xl z-[100] p-1.5 rounded-xl">
          {VIEW_TABS.map((tab) => {
            const isSelected = activeView === tab.id;
            return (
              <DropdownMenuItem
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={cn(
                  "flex items-center justify-between cursor-pointer px-2.5 py-2 focus:bg-white/5 focus:text-white rounded-lg text-xs transition-colors w-full",
                  isSelected ? "bg-violet-600/10 text-violet-300 font-medium" : "text-zinc-400"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <tab.icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-violet-400" : "text-zinc-500")} />
                  <span>{tab.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

