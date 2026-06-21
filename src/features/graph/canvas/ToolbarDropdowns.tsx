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
              ? "bg-[#161b22] text-[#e6edf3] border-[rgba(240,246,252,0.1)]"
              : "text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3] border-transparent"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filter</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {activeDropdown === 'filter' && (
          <div className="absolute left-0 mt-2 w-56 rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] p-3 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 max-h-[80vh] overflow-y-auto">
            <div className="space-y-3.5">
              {/* Node Types Section */}
              <div>
                <div className="text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2 font-mono">Node Types</div>
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
                        className="flex w-full items-center justify-between rounded-sm px-2 py-1 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-3.5 w-3.5 ${type.color}`} />
                          <span>{type.label}</span>
                        </div>
                        {active && <Check className="h-3.5 w-3.5 text-ui-active-text-green" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Diff Status (if compare mode) */}
              {compareBranch && (
                <div>
                  <div className="text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2 font-mono">Diff Status</div>
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
                          className="flex w-full items-center justify-between rounded-sm px-2 py-1 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-3.5 text-center font-bold font-mono ${status.color}`}>{status.symbol}</span>
                            <span>{status.label}</span>
                          </div>
                          {active && <Check className="h-3.5 w-3.5 text-ui-active-text-green" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Layers Focus */}
              <div>
                <div className="text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2 font-mono">Focus Layer</div>
                <div className="grid grid-cols-2 gap-1">
                  {(['all', 'api', 'ui', 'core', 'config'] as const).map((layer) => {
                    const active = activeFocusLayer === layer;
                    return (
                      <button
                        key={layer}
                        type="button"
                        onClick={() => setActiveFocusLayer(layer)}
                        className={`rounded-sm px-1.5 py-0.5 text-center text-[10px] font-semibold font-mono border transition-all ${
                          active
                            ? "bg-[#1c2128] text-[#e6edf3] border-[rgba(240,246,252,0.1)] shadow-sm"
                            : "bg-transparent text-[#8b949e] border-transparent hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3]"
                        }`}
                      >
                        {layer.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Blast Radius Toggle */}
              <div className="border-t border-[rgba(240,246,252,0.1)] pt-2.5">
                <button
                  type="button"
                  onClick={() => setBlastRadiusActive(!blastRadiusActive)}
                  className={`flex w-full items-center justify-between rounded-sm px-2 py-1 text-left text-xs transition-colors ${
                    blastRadiusActive
                      ? "bg-[#1c2128] text-[#e6edf3] border border-[rgba(240,246,252,0.1)]"
                      : "text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3]"
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-semibold">Blast Radius</span>
                    <span className="text-[9px] text-zinc-500 font-mono">Trace change impact</span>
                  </div>
                  {blastRadiusActive && <Check className="h-3.5 w-3.5 text-[#58a6ff]" />}
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
              ? "bg-[#161b22] text-[#e6edf3] border-[rgba(240,246,252,0.1)]"
              : "text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3] border-transparent"
          }`}
        >
          {layoutType === "force" ? <Network className="h-3.5 w-3.5" /> : <GitFork className="h-3.5 w-3.5" />}
          <span>Layout</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {activeDropdown === 'layout' && (
          <div className="absolute left-0 mt-2 w-48 rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] p-1.5 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              type="button"
              onClick={() => {
                setLayoutType("force");
                setActiveDropdown(null);
              }}
              className={`flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-left text-xs ${
                layoutType === "force"
                  ? "bg-[#1c2128] text-[#e6edf3] font-medium"
                  : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)]"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Network className="h-3.5 w-3.5 text-[#8b949e]" />
                  <span>Force Directed</span>
                </div>
                {layoutType === "force" && <Check className="h-3.5 w-3.5 text-ui-active-text-green" />}
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setLayoutType("network");
                setActiveDropdown(null);
              }}
              className={`flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-left text-xs ${
                layoutType === "network"
                  ? "bg-[#1c2128] text-[#e6edf3] font-medium"
                  : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)]"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <GitFork className="h-3.5 w-3.5 text-[#8b949e]" />
                  <span>Hierarchical</span>
                </div>
                {layoutType === "network" && <Check className="h-3.5 w-3.5 text-ui-active-text-green" />}
              </div>
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
              ? "bg-[#161b22] text-[#e6edf3] border-[rgba(240,246,252,0.1)]"
              : "text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3] border-transparent"
          }`}
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {activeDropdown === 'export' && (
          <div className="absolute left-0 mt-2 w-40 rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] p-1.5 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              type="button"
              onClick={() => {
                handleExport("png");
                setActiveDropdown(null);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors"
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
              className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors"
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
