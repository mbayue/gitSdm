import { useState } from 'react';
import { FolderMinus, FolderPlus, PanelLeftClose, Search, X } from 'lucide-react';
import { useVizStore } from '@/stores/vizStore';
import type { RepoAnalysis } from '@/types';
import { SmartFileExplorer } from './SmartFileExplorer';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/Input';

interface ExplorerPanelProps {
  analysis: RepoAnalysis;
  selectedFilePath: string | null;
  onSelectFile: (path: string) => void;
}

export function ExplorerPanel({ analysis, selectedFilePath, onSelectFile }: ExplorerPanelProps) {
  const explorerOpen = useVizStore((s) => s.explorerOpen);
  const setExplorerOpen = useVizStore((s) => s.setExplorerOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [expansionTrigger, setExpansionTrigger] = useState<{ type: 'expand' | 'collapse'; time: number } | null>(null);

  const rootLabel = analysis.meta.fullName.split('/')[1] ?? analysis.meta.repo;

  if (!explorerOpen) return null;

  return (
    <div className="flex h-full w-full shrink-0 flex-col border-r border-border bg-card">
      <header className="flex h-12 shrink-0 items-center justify-between gap-1 border-b border-border px-3 select-none">
        <span className="text-sm font-semibold text-foreground">
          Files
        </span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              type="button"
              aria-label="Expand all folders"
              onClick={() => setExpansionTrigger({ type: 'expand', time: Date.now() })}
              className="icon-button header-action"
            >
              <FolderPlus className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Expand All</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              type="button"
              aria-label="Collapse all folders"
              onClick={() => setExpansionTrigger({ type: 'collapse', time: Date.now() })}
              className="icon-button header-action"
            >
              <FolderMinus className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Collapse All</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger type="button" aria-label="Collapse file explorer"
              onClick={() => setExplorerOpen(false)} className="icon-button header-action">
              <PanelLeftClose className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Collapse file explorer</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Search Input */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            aria-label="Filter files"
            placeholder="Filter files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 bg-background pl-9 pr-9 text-sm dark:bg-background"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear file filter"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
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
