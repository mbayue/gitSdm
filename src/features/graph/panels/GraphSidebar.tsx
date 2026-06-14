import { FolderGit2, Folder, FileCode, ChevronRight, ChevronLeft, RotateCcw, Layers, X, Plus, Star, Trash2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVizStore } from '@/stores/vizStore';
import type { NodeType } from '@/types';

const EXT_COLORS: Record<string, string> = {
  '.ts': '#3b82f6', '.tsx': '#3b82f6', '.js': '#eab308', '.jsx': '#eab308',
  '.json': '#22c55e', '.md': '#f97316', '.py': '#3b82f6', '.css': '#ec4899',
  '.html': '#f97316', '.svg': '#a855f7', '.png': '#a855f7', '.jpg': '#a855f7',
  '.yml': '#ef4444', '.yaml': '#ef4444', '.toml': '#ef4444', '.sh': '#22c55e',
  '.dockerignore': '#6b7280', '.gitignore': '#6b7280',
};

export interface GraphDiff {
  added: Set<string>;
  modified: Set<string>;
  deleted: Set<string>;
}

interface NodeData {
  id: string;
  label: string;
  fileType: string;
  communityName: string;
  degree: number;
  sourceFile?: string;
  color: string;
}

interface GraphSidebarProps {
  fileTypeCounts: [string, number][];
  stats: { nodes: number; edges: number; communities?: number };
  diffCounts?: { added: number; modified: number; deleted: number };
  isEmpty?: boolean;
  graphDiff?: GraphDiff | null;
  defaultBranch?: string;
  selectedNode: NodeData | null;
  neighbors: NodeData[];
  onNodeClick: (node: NodeData) => void;
}

/** Collapsible section header */
function SectionHeader({ label, isOpen, onToggle }: { label: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors select-none"
    >
      <span>{label}</span>
      <ChevronRight className={cn("h-3 w-3 transition-transform duration-150", isOpen && "rotate-90")} />
    </button>
  );
}

export function GraphSidebar({
  fileTypeCounts,
  stats,
  diffCounts,
  isEmpty,
  graphDiff,
  defaultBranch,
}: Omit<GraphSidebarProps, 'selectedNode' | 'neighbors' | 'onNodeClick'>) {
  const {
    nodeTypeFilters,
    toggleNodeTypeFilter,
    fileTypeFilters,
    toggleFileTypeFilter,
    diffStatusFilters,
    toggleDiffStatusFilter,
    compareBranch,
    selectedBranch,
    setCompareBranch,
    blastRadiusActive,
    setBlastRadiusActive,

    resetFilters,
    activeFocusLayer,
    searchQuery,
    setSearchQuery,
    graphSidebarOpen: isOpen,
    setGraphSidebarOpen: setIsOpen,
    graphSidebarSections: sections,
    toggleGraphSidebarSection: toggle,
  } = useVizStore();

  const defaultNodeTypeFilters = new Set<NodeType>(['repo', 'folder', 'file']);
  const hasActiveFilters =
    diffStatusFilters.size > 0 ||
    fileTypeFilters.size > 0 ||
    nodeTypeFilters.size !== defaultNodeTypeFilters.size ||
    [...defaultNodeTypeFilters].some((t) => !nodeTypeFilters.has(t)) ||
    activeFocusLayer !== 'all' ||
    searchQuery !== '';

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute right-0 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-l-md border border-r-0 border-white/15 bg-zinc-950/80 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white shadow-2xl backdrop-blur-md"
        title="Show Filter sidebar"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 z-10 flex flex-col w-[220px] border-l border-white/[0.06] bg-zinc-950/90 backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Analysis</span>
        <div className="flex items-center gap-1">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-0.5 rounded bg-violet-500/10 border border-violet-500/20 px-1 py-0.5 text-[8px] font-semibold text-violet-400 hover:bg-violet-500/20 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="h-2 w-2" />
              Reset
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="rounded text-zinc-500 hover:bg-white/10 hover:text-white transition-colors p-0.5"
            title="Hide Filter sidebar"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-white/[0.08] bg-white/[0.03] pl-7 pr-2 py-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none focus:ring-0 transition-colors"
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 divide-y divide-white/[0.06]">


        {/* Tools Section (Blast Radius) */}
        <div className="py-1">
          <SectionHeader label="Tools" isOpen={sections.tools} onToggle={() => toggle('tools')} />
          {sections.tools && (
            <div className="pb-2">
              <button
                type="button"
                onClick={() => setBlastRadiusActive(!blastRadiusActive)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-all hover:bg-white/5 active:scale-[0.98]",
                  blastRadiusActive ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "border-white/[0.06] opacity-80"
                )}
              >
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold">Blast Radius</span>
                  <span className="text-[9px] text-zinc-500 font-mono">Trace change impact</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Node Types Section */}
        <div className="py-1">
          <SectionHeader label="Node Types" isOpen={sections.nodeTypes} onToggle={() => toggle('nodeTypes')} />
          {sections.nodeTypes && (
            <div className="pb-2 space-y-0.5">
              <button type="button" onClick={() => toggleNodeTypeFilter('repo')} className={cn("flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-all hover:bg-white/5", !nodeTypeFilters.has('repo') && "opacity-40 line-through")}>
                <div className="flex h-4 w-4 items-center justify-center rounded bg-violet-500/10 border border-violet-500/20 text-violet-400 shrink-0"><FolderGit2 className="h-2.5 w-2.5" /></div>
                <span className="text-[11px] text-zinc-300">Repository</span>
              </button>
              <button type="button" onClick={() => toggleNodeTypeFilter('folder')} className={cn("flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-all hover:bg-white/5", !nodeTypeFilters.has('folder') && "opacity-40 line-through")}>
                <div className="flex h-4 w-4 items-center justify-center rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0"><Folder className="h-2.5 w-2.5" /></div>
                <span className="text-[11px] text-zinc-300">Folders</span>
              </button>
              <button type="button" onClick={() => toggleNodeTypeFilter('file')} className={cn("flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-all hover:bg-white/5", !nodeTypeFilters.has('file') && "opacity-40 line-through")}>
                <div className="flex h-4 w-4 items-center justify-center rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0"><FileCode className="h-2.5 w-2.5" /></div>
                <span className="text-[11px] text-zinc-300">Files</span>
              </button>
            </div>
          )}
        </div>

        {/* Branch Compare Section */}
        {compareBranch && (
          <div className="py-1">
            <div className="flex items-center justify-between py-2">
              <button type="button" onClick={() => toggle('compare')} className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors select-none">
                <Layers className="h-3 w-3 text-amber-500" />
                <span>Compare</span>
                <ChevronRight className={cn("h-3 w-3 transition-transform duration-150", sections.compare && "rotate-90")} />
              </button>
              <button onClick={() => setCompareBranch(null)} className="p-0.5 rounded text-zinc-500 hover:bg-white/10 hover:text-red-400 transition-colors" title="Exit compare">
                <X className="h-3 w-3" />
              </button>
            </div>
            {sections.compare && (
              <div className="pb-2 space-y-1.5">
                <div className="text-[9px] text-zinc-500 font-mono truncate">{selectedBranch || defaultBranch || 'main'} ↔ {compareBranch}</div>

                {/* Filter toggles with counts */}
                <div className="space-y-0.5">
                  <button type="button" onClick={() => toggleDiffStatusFilter('added')} className={cn("flex w-full items-center gap-2 rounded px-1.5 py-0.5 text-left hover:bg-white/5", !diffStatusFilters.has('added') && "opacity-40 line-through")}>
                    <div className="flex h-4 w-4 items-center justify-center rounded bg-green-500/10 border border-green-500/20 text-green-400 shrink-0 text-[9px] font-bold">+</div>
                    <span className="text-[10px] text-zinc-300 flex-1">Added</span>
                    {diffCounts && diffCounts.added > 0 && <span className="text-[9px] font-mono text-green-400">{diffCounts.added}</span>}
                  </button>
                  <button type="button" onClick={() => toggleDiffStatusFilter('modified')} className={cn("flex w-full items-center gap-2 rounded px-1.5 py-0.5 text-left hover:bg-white/5", !diffStatusFilters.has('modified') && "opacity-40 line-through")}>
                    <div className="flex h-4 w-4 items-center justify-center rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 shrink-0 text-[9px] font-bold">M</div>
                    <span className="text-[10px] text-zinc-300 flex-1">Modified</span>
                    {diffCounts && diffCounts.modified > 0 && <span className="text-[9px] font-mono text-yellow-400">{diffCounts.modified}</span>}
                  </button>
                  <button type="button" onClick={() => toggleDiffStatusFilter('deleted')} className={cn("flex w-full items-center gap-2 rounded px-1.5 py-0.5 text-left hover:bg-white/5", !diffStatusFilters.has('deleted') && "opacity-40 line-through")}>
                    <div className="flex h-4 w-4 items-center justify-center rounded bg-red-500/10 border border-red-500/20 text-red-400 shrink-0 text-[9px] font-bold">-</div>
                    <span className="text-[10px] text-zinc-300 flex-1">Deleted</span>
                    {diffCounts && diffCounts.deleted > 0 && <span className="text-[9px] font-mono text-red-400">{diffCounts.deleted}</span>}
                  </button>
                </div>

                {/* File list (expanded by default in compare) */}
                {graphDiff && (graphDiff.added.size > 0 || graphDiff.modified.size > 0 || graphDiff.deleted.size > 0) && (
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pt-1">
                    {graphDiff.added.size > 0 && <div><div className="flex items-center gap-0.5 text-[8px] text-emerald-400 uppercase font-semibold mb-0.5"><Plus className="h-2.5 w-2.5" />Added</div>{Array.from(graphDiff.added).map(p => <div key={p} className="text-[9px] font-mono text-zinc-400 truncate pl-3" title={p}>{p}</div>)}</div>}
                    {graphDiff.modified.size > 0 && <div><div className="flex items-center gap-0.5 text-[8px] text-amber-400 uppercase font-semibold mb-0.5"><Star className="h-2.5 w-2.5" />Modified</div>{Array.from(graphDiff.modified).map(p => <div key={p} className="text-[9px] font-mono text-zinc-400 truncate pl-3" title={p}>{p}</div>)}</div>}
                    {graphDiff.deleted.size > 0 && <div><div className="flex items-center gap-0.5 text-[8px] text-red-400 uppercase font-semibold mb-0.5"><Trash2 className="h-2.5 w-2.5" />Deleted</div>{Array.from(graphDiff.deleted).map(p => <div key={p} className="text-[9px] font-mono text-zinc-500 truncate pl-3 line-through" title={p}>{p}</div>)}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* File Types Section */}
        {fileTypeCounts.length > 0 && !isEmpty && nodeTypeFilters.has('file') && (
          <div className="py-1">
            <SectionHeader label="File Types" isOpen={sections.fileTypes} onToggle={() => toggle('fileTypes')} />
            {sections.fileTypes && (
              <div className="pb-2 space-y-0.5">
                {fileTypeCounts.map(([ext, count]) => (
                  <button
                    key={ext}
                    type="button"
                    onClick={() => toggleFileTypeFilter(ext)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-1.5 py-0.5 text-left hover:bg-white/5 transition-all",
                      fileTypeFilters.size > 0 && !fileTypeFilters.has(ext) && "opacity-40 line-through"
                    )}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: EXT_COLORS[ext] || '#6b7280' }} />
                    <span className="text-[10px] text-zinc-300 flex-1 truncate">{ext}</span>
                    <span className="font-mono text-[9px] text-zinc-600">({count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky footer stats */}
      <div className="shrink-0 border-t border-white/[0.06] px-3 py-2 font-mono text-[9px] text-zinc-500 text-center bg-zinc-950/95">
        {stats.nodes} nodes · {stats.edges} edges{stats.communities !== undefined ? ` · ${stats.communities} comm.` : ''}
      </div>
    </div>
  );
}
