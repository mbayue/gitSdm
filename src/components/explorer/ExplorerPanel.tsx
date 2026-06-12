import { PanelLeftClose, PanelLeftOpen, FileCode } from 'lucide-react';
import { useVizStore } from '@/stores/vizStore';
import type { RepoAnalysis } from '@/types';
import { SmartFileExplorer } from './SmartFileExplorer';

interface ExplorerPanelProps {
  analysis: RepoAnalysis;
  selectedFilePath: string | null;
  onSelectFile: (path: string) => void;
}

export function ExplorerPanel({ analysis, selectedFilePath, onSelectFile }: ExplorerPanelProps) {
  const { explorerOpen, setExplorerOpen, inspectorOpen, setInspectorOpen } = useVizStore();
  const rootLabel = analysis.meta.fullName.split('/')[1] ?? analysis.meta.repo;

  if (!explorerOpen) {
    return (
      <div className="hidden md:flex w-10 shrink-0 flex-col items-center border-r border-white/[0.06] bg-zinc-950 py-2">
        <button
          type="button"
          onClick={() => setExplorerOpen(true)}
          className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
          title="Show explorer"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="hidden md:flex h-full w-[220px] shrink-0 flex-col border-r border-white/[0.06] bg-zinc-950">
      <header className="flex h-9 shrink-0 items-center gap-1 border-b border-white/[0.06] px-2">
        <span className="flex-1 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
          Explorer
        </span>
        <button
          type="button"
          onClick={() => setInspectorOpen(!inspectorOpen)}
          className={`rounded p-1 transition-colors ${inspectorOpen
            ? 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20'
            : 'text-zinc-600 hover:bg-white/5 hover:text-zinc-400'
            }`}
          title={inspectorOpen ? "Hide code inspector" : "Show code inspector"}
        >
          <FileCode className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setExplorerOpen(false)}
          className="rounded p-1 text-zinc-600 hover:bg-white/5 hover:text-zinc-400"
          title="Hide explorer"
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </button>
      </header>
      <SmartFileExplorer
        tree={analysis.tree}
        rootLabel={rootLabel}
        selectedPath={selectedFilePath ?? undefined}
        onSelectFile={onSelectFile}
      />
    </div>
  );
}
