import { Filter, ChevronDown, Check, FolderGit2, Folder, FileCode, Network, GitFork, Download } from 'lucide-react';
import type { LayoutType } from '@/stores/vizStore';

interface ToolbarDropdownProps {
  activeDropdown: 'filter' | 'layout' | 'export' | null;
  setActiveDropdown: (dropdown: 'filter' | 'layout' | 'export' | null) => void;
  nodeTypeFilters: Set<string>;
  toggleNodeTypeFilter: (type: 'repo' | 'folder' | 'file') => void;
  compareBranch: boolean;
  diffStatusFilters: Set<string>;
  toggleDiffStatusFilter: (status: 'added' | 'modified' | 'deleted') => void;
  activeFocusLayer: 'all' | 'api' | 'ui' | 'core' | 'config';
  setActiveFocusLayer: (layer: 'all' | 'api' | 'ui' | 'core' | 'config') => void;
  blastRadiusActive: boolean;
  setBlastRadiusActive: (active: boolean) => void;
  layoutType: LayoutType;
  setLayoutType: (type: LayoutType) => void;
  handleExport: (format: 'png' | 'pdf') => void;
}

export function ToolbarDropdowns({
  activeDropdown,
  setActiveDropdown,
  nodeTypeFilters,
  toggleNodeTypeFilter,
  compareBranch,
  diffStatusFilters,
  toggleDiffStatusFilter,
  activeFocusLayer,
  setActiveFocusLayer,
  blastRadiusActive,
  setBlastRadiusActive,
  layoutType,
  setLayoutType,
  handleExport,
}: ToolbarDropdownProps) {
  return (
    <>
      {/* Filter Dropdown Toggle */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'filter' ? null : 'filter')}
          className={`flex h-8 px-2.5 items-center gap-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.95] ${
            activeDropdown === 'filter'
              ? "bg-violet-600/20 text-violet-200 border border-violet-500/30"
              : "text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filter</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {activeDropdown === 'filter' && (
          <div className="absolute left-0 mt-2 w-56 rounded-xl border border-white/[0.08] bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="space-y-3.5">
              {/* Node Types Section */}
              <div>
                <div className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 font-mono">Node Types</div>
                <div className="space-y-1">
                  {[
                    { id: 'repo' as const, label: 'Repository', icon: FolderGit2, color: 'text-violet-400' },
                    { id: 'folder' as const, label: 'Folders', icon: Folder, color: 'text-amber-400' },
                    { id: 'file' as const, label: 'Files', icon: FileCode, color: 'text-blue-400' }
                  ].map((type) => {
                    const Icon = type.icon;
                    const active = nodeTypeFilters.has(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => toggleNodeTypeFilter(type.id)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs text-zinc-300 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-3.5 w-3.5 ${type.color}`} />
                          <span>{type.label}</span>
                        </div>
                        {active && <Check className="h-3.5 w-3.5 text-violet-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Diff Status (if compare mode) */}
              {compareBranch && (
                <div>
                  <div className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 font-mono">Diff Status</div>
                  <div className="space-y-1">
                    {[
                      { id: 'added' as const, label: 'Added', symbol: '+', color: 'text-green-400' },
                      { id: 'modified' as const, label: 'Modified', symbol: '~', color: 'text-amber-400' },
                      { id: 'deleted' as const, label: 'Deleted', symbol: '-', color: 'text-red-400' }
                    ].map((status) => {
                      const active = diffStatusFilters.has(status.id);
                      return (
                        <button
                          key={status.id}
                          type="button"
                          onClick={() => toggleDiffStatusFilter(status.id)}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs text-zinc-300 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-3.5 text-center font-bold font-mono ${status.color}`}>{status.symbol}</span>
                            <span>{status.label}</span>
                          </div>
                          {active && <Check className="h-3.5 w-3.5 text-violet-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Layers Focus */}
              <div>
                <div className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 font-mono">Focus Layer</div>
                <div className="grid grid-cols-2 gap-1">
                  {(['all', 'api', 'ui', 'core', 'config'] as const).map((layer) => {
                    const active = activeFocusLayer === layer;
                    return (
                      <button
                        key={layer}
                        type="button"
                        onClick={() => setActiveFocusLayer(layer)}
                        className={`rounded px-1.5 py-0.5 text-center text-[10px] font-semibold font-mono border transition-all ${
                          active
                            ? "bg-violet-600/20 text-violet-200 border-violet-500/30 shadow-sm"
                            : "bg-white/[0.02] text-zinc-400 border-transparent hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {layer.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Blast Radius Toggle */}
              <div className="border-t border-white/[0.06] pt-2.5">
                <button
                  type="button"
                  onClick={() => setBlastRadiusActive(!blastRadiusActive)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs transition-colors ${
                    blastRadiusActive
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-semibold">Blast Radius</span>
                    <span className="text-[9px] text-zinc-500 font-mono">Trace change impact</span>
                  </div>
                  {blastRadiusActive && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Layout Dropdown Toggle */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'layout' ? null : 'layout')}
          className={`flex h-8 px-2.5 items-center gap-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.95] ${
            activeDropdown === 'layout'
              ? "bg-violet-600/20 text-violet-200 border border-violet-500/30"
              : "text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent"
          }`}
        >
          {layoutType === "force" ? <Network className="h-3.5 w-3.5" /> : <GitFork className="h-3.5 w-3.5" />}
          <span>Layout</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {activeDropdown === 'layout' && (
          <div className="absolute left-0 mt-2 w-48 rounded-xl border border-white/[0.08] bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              type="button"
              onClick={() => {
                setLayoutType("force");
                setActiveDropdown(null);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs ${
                layoutType === "force"
                  ? "bg-violet-600/10 text-violet-200 font-medium"
                  : "text-zinc-300 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <Network className="h-3.5 w-3.5 text-violet-400" />
                <span>Organic Cluster</span>
              </div>
              {layoutType === "force" && <Check className="h-3.5 w-3.5 text-violet-400" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setLayoutType("network");
                setActiveDropdown(null);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs ${
                layoutType === "network"
                  ? "bg-violet-600/10 text-violet-200 font-medium"
                  : "text-zinc-300 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <GitFork className="h-3.5 w-3.5 text-violet-400" />
                <span>Hierarchical Network</span>
              </div>
              {layoutType === "network" && <Check className="h-3.5 w-3.5 text-violet-400" />}
            </button>
          </div>
        )}
      </div>

      {/* Export Dropdown Toggle */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'export' ? null : 'export')}
          className={`flex h-8 px-2.5 items-center gap-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.95] ${
            activeDropdown === 'export'
              ? "bg-violet-600/20 text-violet-200 border border-violet-500/30"
              : "text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent"
          }`}
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {activeDropdown === 'export' && (
          <div className="absolute left-0 mt-2 w-40 rounded-xl border border-white/[0.08] bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              type="button"
              onClick={() => {
                handleExport("png");
                setActiveDropdown(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-zinc-300 hover:bg-white/5 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-zinc-400" />
              <span>PNG Image</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleExport("pdf");
                setActiveDropdown(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-zinc-300 hover:bg-white/5 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-zinc-400" />
              <span>PDF Document</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
