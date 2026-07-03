import { useEffect, useState } from 'react';
import { Filter, ChevronDown, Check, FolderGit2, Folder, FileCode, Download, AlertTriangle, Layers } from 'lucide-react';
import type { ReactNode } from 'react';
import type { GraphScope, ContentFilter, ColorMode, SizeMode } from '@/stores/vizStore';
import { LegendPanel } from './widgets/LegendPanel';

const sectionHeaderClass = "mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#c9d1d9] font-mono";
const sectionClass = "space-y-1.5 border-t border-[rgba(240,246,252,0.08)] pt-3 first:border-t-0 first:pt-0";
const focusClass = "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ui-focus/70 focus-visible:ring-offset-1 focus-visible:ring-offset-[#161b22]";
const inactiveRowClass = "text-[#8b949e] hover:bg-[rgba(240,246,252,0.08)] hover:text-[#e6edf3]";
const dropdownPanelClass = "absolute left-0 mt-2 rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] p-3 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 max-h-[calc(100vh-3rem)] overflow-y-auto";
const toolbarButtonClass = (active: boolean) =>
  `flex h-8 px-2.5 items-center gap-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.95] ${
    active
      ? "bg-[#161b22] text-[#e6edf3] border-[rgba(240,246,252,0.1)]"
      : "text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3] border-transparent"
  }`;

const nodeTypes = [
  { id: 'repo' as const, label: 'Repository', shortLabel: 'Repo', icon: FolderGit2, color: 'text-violet-400' },
  { id: 'folder' as const, label: 'Folders', shortLabel: 'Folders', icon: Folder, color: 'text-amber-400' },
  { id: 'file' as const, label: 'Files', shortLabel: 'Files', icon: FileCode, color: 'text-blue-400' },
];

const graphScopes = [
  { id: 'important' as const, label: 'Important' },
  { id: 'source' as const, label: 'Source' },
  { id: 'grouped' as const, label: 'Grouped' },
  { id: 'full' as const, label: 'Full graph' },
];

const presetContentLabels: Record<Exclude<GraphScope, 'full'>, string> = {
  important: 'Source + Config',
  source: 'Source + Config',
  grouped: 'Source + Config',
};

const contentFilterOptions = [
  { id: 'source' as const, label: 'Source' },
  { id: 'config' as const, label: 'Config' },
  { id: 'docs' as const, label: 'Docs' },
  { id: 'tests' as const, label: 'Tests' },
  { id: 'github' as const, label: '.github' },
  { id: 'examples' as const, label: 'Examples' },
  { id: 'generated' as const, label: 'Generated' },
  { id: 'translations' as const, label: 'Locales' },
];

const focusLayers = [
  { id: 'all' as const, label: 'All' },
  { id: 'ui' as const, label: 'UI' },
  { id: 'api' as const, label: 'API' },
  { id: 'core' as const, label: 'Core' },
  { id: 'config' as const, label: 'Config' },
];

const diffStatuses = [
  { id: 'added' as const, label: 'Added', symbol: '+', color: 'text-green-400' },
  { id: 'modified' as const, label: 'Modified', symbol: '~', color: 'text-amber-400' },
  { id: 'deleted' as const, label: 'Deleted', symbol: '-', color: 'text-red-400' },
];

function SectionHeader({ children }: { children: ReactNode }) {
  return <div className={sectionHeaderClass}>{children}</div>;
}

function CheckboxMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors ${
        checked
          ? "border-ui-active-text-green/60 bg-ui-active/20 text-ui-active-text-green"
          : "border-[rgba(240,246,252,0.16)] bg-[#0d1117]"
      }`}
    >
      {checked && <Check className="h-2.5 w-2.5" />}
    </span>
  );
}

function DropdownPanel({ width, children }: { width: string; children: ReactNode }) {
  return (
    <div className={`${dropdownPanelClass} ${width}`}>
      {children}
    </div>
  );
}

interface ToolbarDropdownProps {
  activeDropdown: 'filter' | 'display' | 'layout' | 'export' | 'legend' | null;
  setActiveDropdown: (dropdown: 'filter' | 'display' | 'layout' | 'export' | 'legend' | null) => void;
  nodeTypeFilters: Set<string>;
  toggleNodeTypeFilter: (type: 'repo' | 'folder' | 'file') => void;
  compareBranch: boolean;
  diffStatusFilters: Set<string>;
  toggleDiffStatusFilter: (status: 'added' | 'modified' | 'deleted') => void;
  activeFocusLayer: 'all' | 'api' | 'ui' | 'core' | 'config';
  setActiveFocusLayer: (layer: 'all' | 'api' | 'ui' | 'core' | 'config') => void;
  blastRadiusActive: boolean;
  setBlastRadiusActive: (active: boolean) => void;
  handleExport: (format: 'png' | 'pdf') => void;
  graphScope: GraphScope;
  setGraphScope: (scope: GraphScope) => void;
  contentFilters: Set<ContentFilter>;
  toggleContentFilter: (filter: ContentFilter) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  sizeMode: SizeMode;
  setSizeMode: (mode: SizeMode) => void;
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
  handleExport,
  graphScope,
  setGraphScope,
  contentFilters,
  toggleContentFilter,
  colorMode,
  setColorMode,
  sizeMode,
  setSizeMode,
}: ToolbarDropdownProps) {
  const [contentCustomize, setContentCustomize] = useState(false);

  useEffect(() => {
    setContentCustomize(false);
  }, [graphScope]);

  const showContentGrid = graphScope === 'full' || contentCustomize;
  const displayActive = colorMode !== 'default' || sizeMode !== 'default' || blastRadiusActive;

  const handleScopeChange = (scope: GraphScope) => {
    setGraphScope(scope);
    setContentCustomize(false);
  };

  return (
    <>
      {/* Filter */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'filter' ? null : 'filter')}
          className={toolbarButtonClass(activeDropdown === 'filter')}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filter</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {activeDropdown === 'filter' && (
          <DropdownPanel width="w-[280px]">
            <div className="space-y-3">
              {/* Graph Scope — primary control */}
              <div className={sectionClass}>
                <div className={`${sectionHeaderClass} flex items-center gap-1.5`}>
                  Graph Scope
                  {graphScope === 'full' && (
                    <span title="Full graph may be slow for large repositories">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {graphScopes.map((scope) => {
                    const active = graphScope === scope.id;
                    return (
                      <button
                        key={scope.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => handleScopeChange(scope.id)}
                        className={`rounded px-2 py-1 text-center text-[11px] font-semibold transition-all active:scale-[0.98] ${focusClass} ${
                          active
                            ? "bg-[#1c2128] text-[#e6edf3] border border-[rgba(240,246,252,0.1)] shadow-sm"
                            : "bg-transparent text-[#8b949e] border border-transparent hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3]"
                        }`}
                      >
                        {scope.label}
                      </button>
                    );
                  })}
                </div>
                {graphScope === 'full' && (
                  <p className="mt-1.5 text-[10px] text-amber-500/80 leading-tight px-1">
                    Full graph may be slow for large repositories.
                  </p>
                )}
              </div>

              {/* Node Types — compact chips */}
              <div className={sectionClass}>
                <SectionHeader>Node Types</SectionHeader>
                <div className="flex gap-1" role="group" aria-label="Node types">
                  {nodeTypes.map((type) => {
                    const Icon = type.icon;
                    const active = nodeTypeFilters.has(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        title={type.label}
                        aria-pressed={active}
                        aria-label={type.label}
                        onClick={() => toggleNodeTypeFilter(type.id)}
                        className={`flex flex-1 flex-col items-center gap-0.5 rounded px-1 py-1.5 text-[9px] font-semibold transition-all active:scale-[0.97] ${focusClass} ${
                          active
                            ? "bg-[#1c2128] text-[#e6edf3] ring-1 ring-[rgba(240,246,252,0.12)]"
                            : "text-[#8b949e] hover:bg-[rgba(240,246,252,0.08)] hover:text-[#e6edf3]"
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${active ? type.color : ''}`} />
                        <span>{type.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content — hidden on presets unless customized */}
              <div className={sectionClass}>
                <SectionHeader>Content</SectionHeader>
                {showContentGrid ? (
                  <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5">
                    {contentFilterOptions.map((filter) => {
                      const active = contentFilters.has(filter.id);
                      return (
                        <button
                          key={filter.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleContentFilter(filter.id)}
                          className={`flex items-center gap-1.5 rounded px-1.5 py-1 text-left text-[11px] transition-colors active:scale-[0.99] ${focusClass} ${
                            active ? "text-[#e6edf3]" : inactiveRowClass
                          }`}
                        >
                          <CheckboxMark checked={active} />
                          <span className="font-medium">{filter.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 rounded bg-[#0d1117] px-2 py-1.5 ring-1 ring-[rgba(240,246,252,0.08)]">
                    <span className="text-[11px] text-[#8b949e] leading-snug">
                      {presetContentLabels[graphScope]}
                      <span className="text-[#6e7681]"> · {graphScopes.find((s) => s.id === graphScope)?.label} preset</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setContentCustomize(true)}
                      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] transition-colors ${focusClass}`}
                    >
                      Customize
                    </button>
                  </div>
                )}
              </div>

              {/* Focus Layer */}
              <div className={sectionClass}>
                <SectionHeader>Focus Layer</SectionHeader>
                <div className="grid grid-cols-5 gap-1 rounded bg-[#0d1117] p-1 ring-1 ring-[rgba(240,246,252,0.08)]" role="group" aria-label="Focus layer">
                  {focusLayers.map((layer) => {
                    const active = activeFocusLayer === layer.id;
                    return (
                      <button
                        key={layer.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setActiveFocusLayer(layer.id)}
                        className={`rounded px-1.5 py-1 text-center text-[10px] font-semibold font-mono transition-all active:scale-[0.97] ${focusClass} ${
                          active
                            ? "bg-[#1c2128] text-[#e6edf3] shadow-sm ring-1 ring-[rgba(240,246,252,0.12)]"
                            : "text-[#8b949e] hover:bg-[rgba(240,246,252,0.08)] hover:text-[#e6edf3]"
                        }`}
                      >
                        {layer.label.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Diff Status — compact chips (compare mode) */}
              {compareBranch && (
                <div className={sectionClass}>
                  <SectionHeader>Diff Status</SectionHeader>
                  <div className="flex gap-1" role="group" aria-label="Diff status">
                    {diffStatuses.map((status) => {
                      const active = diffStatusFilters.has(status.id);
                      return (
                        <button
                          key={status.id}
                          type="button"
                          title={status.label}
                          aria-pressed={active}
                          aria-label={status.label}
                          onClick={() => toggleDiffStatusFilter(status.id)}
                          className={`flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 text-[11px] font-semibold transition-all active:scale-[0.97] ${focusClass} ${
                            active
                              ? "bg-[#1c2128] text-[#e6edf3] ring-1 ring-[rgba(240,246,252,0.12)]"
                              : "text-[#8b949e] hover:bg-[rgba(240,246,252,0.08)] hover:text-[#e6edf3]"
                          }`}
                        >
                          <span className={`font-mono font-bold ${status.color}`}>{status.symbol}</span>
                          <span>{status.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </DropdownPanel>
        )}
      </div>

      {/* Display */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'display' ? null : 'display')}
          className={toolbarButtonClass(activeDropdown === 'display')}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Display</span>
          {displayActive && (
            <span className="h-1.5 w-1.5 rounded-full bg-ui-active-text-green" aria-label="Display options active" />
          )}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {activeDropdown === 'display' && (
          <DropdownPanel width="w-[260px]">
            <div className="space-y-3">
              {/* Blast Radius — compact toggle */}
              <div className={sectionClass}>
                <SectionHeader>Blast Radius</SectionHeader>
                <button
                  type="button"
                  aria-pressed={blastRadiusActive}
                  title="Highlight direct dependencies around selected node"
                  onClick={() => setBlastRadiusActive(!blastRadiusActive)}
                  className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-[11px] transition-colors active:scale-[0.99] ${focusClass} ${
                    blastRadiusActive
                      ? "bg-[#1c2128] text-[#e6edf3] ring-1 ring-[rgba(240,246,252,0.1)]"
                      : "text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3]"
                  }`}
                >
                  <span className="font-medium text-[#e6edf3]">Trace change impact</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${blastRadiusActive ? "bg-ui-active/20 text-ui-active-text-green" : "bg-[#0d1117] text-[#8b949e]"}`}>
                    {blastRadiusActive ? 'On' : 'Off'}
                  </span>
                </button>
              </div>

              {/* Node Overlay */}
              <div className={sectionClass}>
                <SectionHeader>Node Overlay</SectionHeader>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8b949e] font-medium">Color by</span>
                    <div className="flex gap-0.5 rounded bg-[#0d1117] p-0.5 ring-1 ring-[rgba(240,246,252,0.08)]" role="group">
                      {(['default', 'churn', 'complexity'] as ColorMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          aria-pressed={colorMode === mode}
                          onClick={() => setColorMode(mode)}
                          className={`rounded px-1.5 py-0.5 text-[9px] font-semibold transition-all active:scale-[0.97] ${focusClass} ${
                            colorMode === mode
                              ? 'bg-[#1c2128] text-[#e6edf3] shadow-sm'
                              : 'text-[#8b949e] hover:bg-[rgba(240,246,252,0.08)] hover:text-[#e6edf3]'
                          }`}
                        >
                          {mode === 'default' ? 'Default' : mode === 'churn' ? 'Churn' : 'Complexity'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8b949e] font-medium">Size by</span>
                    <div className="flex gap-0.5 rounded bg-[#0d1117] p-0.5 ring-1 ring-[rgba(240,246,252,0.08)]" role="group">
                      {(['default', 'complexity'] as SizeMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          aria-pressed={sizeMode === mode}
                          onClick={() => setSizeMode(mode)}
                          className={`rounded px-1.5 py-0.5 text-[9px] font-semibold transition-all active:scale-[0.97] ${focusClass} ${
                            sizeMode === mode
                              ? 'bg-[#1c2128] text-[#e6edf3] shadow-sm'
                              : 'text-[#8b949e] hover:bg-[rgba(240,246,252,0.08)] hover:text-[#e6edf3]'
                          }`}
                        >
                          {mode === 'default' ? 'Default' : 'Complexity'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DropdownPanel>
        )}
      </div>

      {/* Export */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'export' ? null : 'export')}
          className={toolbarButtonClass(activeDropdown === 'export')}
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {activeDropdown === 'export' && (
          <DropdownPanel width="w-40">
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
          </DropdownPanel>
        )}
      </div>

      <LegendPanel
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
        compareBranch={compareBranch}
        colorMode={colorMode}
        sizeMode={sizeMode}
        blastRadiusActive={blastRadiusActive}
      />
    </>
  );
}
