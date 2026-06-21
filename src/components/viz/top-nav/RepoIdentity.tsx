import { Link } from 'react-router-dom';
import { GitBranch, ChevronDown, Check } from 'lucide-react';
import { useVizStore } from '@/stores/vizStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { VIEW_TABS } from './viewTabs';

interface RepoIdentityProps {
  owner: string;
  repoName: string;
}

export function RepoIdentity({ owner, repoName }: RepoIdentityProps) {
  const { activeView, setActiveView } = useVizStore();

  const currentTab = VIEW_TABS.find((t) => t.id === activeView) || VIEW_TABS[0];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink select-none">
      <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Home">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-all shadow-sm">
          <GitBranch className="h-4 w-4" />
        </div>
      </Link>

      <a
        href={`https://github.com/${owner}/${repoName}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden min-[420px]:flex min-w-0 items-center text-xs font-mono transition-colors hover:text-[#58a6ff]"
        title={`${owner}/${repoName}`}
      >
        <span className="truncate font-medium text-zinc-500 max-w-[48px] sm:max-w-[100px] lg:max-w-[140px]">
          {owner}
        </span>
        <span className="mx-1.5 shrink-0 text-zinc-700 font-sans font-light">/</span>
        <span className="truncate font-bold text-zinc-200 max-w-[64px] sm:max-w-[140px] lg:max-w-[220px]">
          {repoName}
        </span>
      </a>

      <span className="hidden sm:inline text-zinc-800 font-sans font-light shrink-0">/</span>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex shrink-0 items-center gap-1 sm:gap-1.5 h-6 px-1.5 sm:px-2.5 rounded-md text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-white/[0.04] transition-all outline-none cursor-pointer">
          <currentTab.icon className="h-3.5 w-3.5 text-[#8b949e] shrink-0" />
          <span className="hidden sm:inline font-sans">{currentTab.label}</span>
          <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={6} className="w-52 bg-[#161b22] border-[rgba(240,246,252,0.1)] shadow-2xl z-[100] p-1.5 rounded-md">
          {VIEW_TABS.map((tab) => {
            const isSelected = activeView === tab.id;
            return (
              <DropdownMenuItem
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={cn(
                  "flex items-center justify-between cursor-pointer px-2.5 py-1.5 focus:bg-[rgba(240,246,252,0.1)] focus:text-[#e6edf3] rounded-sm text-xs transition-colors w-full",
                  isSelected ? "bg-[#1c2128] text-[#e6edf3] font-medium" : "text-[#8b949e]"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <tab.icon className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-[#e6edf3]" : "text-[#8b949e]")} />
                  <span>{tab.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#e6edf3] shrink-0" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

