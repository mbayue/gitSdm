import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, FolderMinus, FolderPlus, Search, X } from 'lucide-react';
import { useVizStore } from '@/stores/vizStore';
import type { RepoAnalysis } from '@/types';
import { SmartFileExplorer } from './SmartFileExplorer';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ExplorerPanelProps {
  analysis: RepoAnalysis;
  selectedFilePath: string | null;
  onSelectFile: (path: string) => void;
}

export function ExplorerPanel({ analysis, selectedFilePath, onSelectFile }: ExplorerPanelProps) {
  const { explorerOpen, setExplorerOpen } = useVizStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expansionTrigger, setExpansionTrigger] = useState<{ type: 'expand' | 'collapse'; time: number } | null>(null);

  const rootLabel = analysis.meta.fullName.split('/')[1] ?? analysis.meta.repo;

  if (!explorerOpen) {
    return (
      <div className="hidden md:flex h-full w-10 shrink-0 flex-col items-center border-r border-[rgba(240,246,252,0.1)] bg-[#0d1117] py-2 select-none">
        <Tooltip>
          <TooltipTrigger
            type="button"
            onClick={() => setExplorerOpen(true)}
            className="rounded p-1.5 text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3] transition-colors outline-none cursor-pointer"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent side="right">Show Explorer</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full shrink-0 flex-col border-r border-[rgba(240,246,252,0.1)] bg-[#0d1117]">
      <header className="flex h-10 shrink-0 items-center justify-between gap-1 border-b border-[rgba(240,246,252,0.1)] px-3 select-none">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e]">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              type="button"
              onClick={() => setExpansionTrigger({ type: 'expand', time: Date.now() })}
              className="rounded p-1 text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3] transition-colors outline-none cursor-pointer"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Expand All</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              type="button"
              onClick={() => setExpansionTrigger({ type: 'collapse', time: Date.now() })}
              className="rounded p-1 text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3] transition-colors outline-none cursor-pointer"
            >
              <FolderMinus className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Collapse All</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              type="button"
              onClick={() => setExplorerOpen(false)}
              className="rounded p-1 text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3] transition-colors outline-none cursor-pointer"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Hide Explorer</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Search Input */}
      <div className="px-2 py-2 border-b border-[rgba(240,246,252,0.1)] bg-[#0d1117]">
        <div className="relative">
          <Search className="absolute left-2 top-[7px] h-3.5 w-3.5 text-[#8b949e]" />
          <input
            type="text"
            placeholder="Filter files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] py-1 pl-7 pr-6 text-xs text-[#e6edf3] placeholder-[#8b949e] outline-none focus:border-[#58a6ff] transition-colors font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1.5 rounded-sm p-0.5 text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <SmartFileExplorer
        tree={analysis.tree}
        rootLabel={rootLabel}
        selectedPath={selectedFilePath ?? undefined}
        onSelectFile={onSelectFile}
        searchQuery={searchQuery}
        expansionTrigger={expansionTrigger}
      />
    </div>
  );
}
