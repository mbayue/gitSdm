import { TooltipHint } from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';
import { Filter, ChevronDown, Check, FolderGit2, Folder, FileCode, Package, Download, AlertTriangle, Layers, Workflow } from 'lucide-react';
import type { NodeType } from '@/types';
import type { ReactNode } from 'react';
import type { GraphScope, ContentFilter, ColorMode, SizeMode, LayoutType } from '@/stores/vizStore';
import { LegendPanel } from './widgets/LegendPanel';
import { DropdownPanel } from './widgets/DropdownPanel';

const sectionHeaderClass = "mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground font-mono";
const sectionClass = "space-y-1.5 border-t border-border pt-3 first:border-t-0 first:pt-0";
const focusClass = "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ui-focus/70 focus-visible:ring-offset-1 focus-visible:ring-offset-popover";
const inactiveRowClass = "text-muted-foreground hover:bg-secondary hover:text-foreground";
const toolbarButtonClass = (active: boolean) =>
  `flex h-9 px-2.5 items-center gap-1.5 rounded-md text-sm font-medium transition-all active:scale-[0.95] ${
    active
      ? "bg-popover text-foreground border-border"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground border-transparent"
  }`;

const nodeTypes = [
  { id: 'repo' as const, label: 'Repository', shortLabel: 'Repo', icon: FolderGit2, color: 'text-violet-400' },
  { id: 'folder' as const, label: 'Folders', shortLabel: 'Folders', icon: Folder, color: 'text-warning' },
  { id: 'file' as const, label: 'Files', shortLabel: 'Files', icon: FileCode, color: 'text-blue-400' },
  { id: 'package' as const, label: 'Packages', shortLabel: 'Packages', icon: Package, color: 'text-success' },
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
  { id: 'added' as const, label: 'Added', symbol: '+', color: 'text-success' },
  { id: 'modified' as const, label: 'Modified', symbol: '~', color: 'text-warning' },
  { id: 'deleted' as const, label: 'Deleted', symbol: '-', color: 'text-destructive' },
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
          : "border-input bg-background"
      }`}
    >
      {checked && <Check className="h-2.5 w-2.5" />}
    </span>
  );
}

interface ToolbarDropdownProps {
  activeDropdown: 'filter' | 'display' | 'layout' | 'export' | 'legend' | null;
  setActiveDropdown: (dropdown: 'filter' | 'display' | 'layout' | 'export' | 'legend' | null) => void;
  nodeTypeFilters: Set<string>;
  toggleNodeTypeFilter: (type: NodeType) => void;
  nodeColors: Partial<Record<NodeType, string>>;
  exportDisabled: boolean;
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
  layoutType: LayoutType;
  setLayoutType: (layout: LayoutType) => void;
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
  layoutType,
  setLayoutType,
  nodeColors,
  exportDisabled,
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
          aria-expanded={activeDropdown === 'filter'}
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
                    <TooltipHint content="Full graph may be slow for large repositories"><span>
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                    </span></TooltipHint>
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
                        className={`rounded px-2 py-1 text-center text-xs font-semibold transition-all active:scale-[0.98] ${focusClass} ${
                          active
                            ? "bg-secondary text-foreground border border-border shadow-sm"
                            : "bg-transparent text-muted-foreground border border-transparent hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        {scope.label}
                      </button>
                    );
                  })}
                </div>
                {graphScope === 'full' && (
                  <p className="mt-1.5 text-xs text-amber-500/80 leading-tight px-1">
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
                      <TooltipHint key={type.id} content={type.label}><button
                        type="button"
                        aria-pressed={active}
                        aria-label={type.label}
                        onClick={() => toggleNodeTypeFilter(type.id)}
                        className={`flex flex-1 flex-col items-center gap-0.5 rounded px-1 py-1.5 text-xs font-semibold transition-all active:scale-[0.97] ${focusClass} ${
                          active
                            ? "bg-secondary text-foreground ring-1 ring-border"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${active ? type.color : ''}`} />
                        <span>{type.shortLabel}</span>
                      </button></TooltipHint>
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
                          className={`flex items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs transition-colors active:scale-[0.99] ${focusClass} ${
                            active ? "text-foreground" : inactiveRowClass
                          }`}
                        >
                          <CheckboxMark checked={active} />
                          <span className="font-medium">{filter.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 rounded bg-background px-2 py-1.5 ring-1 ring-border">
                    <span className="text-xs text-muted-foreground leading-snug">
                      {presetContentLabels[graphScope]}
                      <span className="text-muted-foreground"> · {graphScopes.find((s) => s.id === graphScope)?.label} preset</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setContentCustomize(true)}
                      className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors ${focusClass}`}
                    >
                      Customize
                    </button>
                  </div>
                )}
              </div>

              {/* Focus Layer */}
              <div className={sectionClass}>
                <SectionHeader>Focus Layer</SectionHeader>
                <div className="grid grid-cols-3 gap-1 rounded bg-background p-1 ring-1 ring-border" role="group" aria-label="Focus layer">
                  {focusLayers.map((layer) => {
                    const active = activeFocusLayer === layer.id;
                    return (
                      <button
                        key={layer.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setActiveFocusLayer(layer.id)}
                        className={`rounded px-1.5 py-1 text-center text-xs font-semibold font-mono transition-all active:scale-[0.97] ${focusClass} ${
                          active
                            ? "bg-secondary text-foreground shadow-sm ring-1 ring-border"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
                        <TooltipHint key={status.id} content={status.label}><button
                          type="button"
                          aria-pressed={active}
                          aria-label={status.label}
                          onClick={() => toggleDiffStatusFilter(status.id)}
                          className={`flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 text-xs font-semibold transition-all active:scale-[0.97] ${focusClass} ${
                            active
                              ? "bg-secondary text-foreground ring-1 ring-border"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                        >
                          <span className={`font-mono font-bold ${status.color}`}>{status.symbol}</span>
                          <span>{status.label}</span>
                        </button></TooltipHint>
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
          aria-expanded={activeDropdown === 'display'}
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
                <TooltipHint content="Highlight direct and indirect dependents as you select files or folders"><button
                  type="button"
                  aria-pressed={blastRadiusActive}
                  onClick={() => setBlastRadiusActive(!blastRadiusActive)}
                  className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-xs transition-colors active:scale-[0.99] ${focusClass} ${
                    blastRadiusActive
                      ? "bg-secondary text-foreground ring-1 ring-border"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <span className="font-medium text-foreground">Trace change impact</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${blastRadiusActive ? "bg-ui-active/20 text-ui-active-text-green" : "bg-background text-muted-foreground"}`}>
                    {blastRadiusActive ? 'On' : 'Off'}
                  </span>
                </button></TooltipHint>
              </div>

              {/* Node Overlay */}
              <div className={sectionClass}>
                <SectionHeader>Node Overlay</SectionHeader>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Color by</span>
                    <div className="flex gap-0.5 rounded bg-background p-0.5 ring-1 ring-border" role="group" aria-label="Color by">
                      {(['default', 'churn', 'complexity'] as ColorMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          aria-pressed={colorMode === mode}
                          onClick={() => setColorMode(mode)}
                          className={`rounded px-1.5 py-0.5 text-xs font-semibold transition-all active:scale-[0.97] ${focusClass} ${
                            colorMode === mode
                              ? 'bg-secondary text-foreground shadow-sm'
                              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                          }`}
                        >
                          {mode === 'default' ? 'Default' : mode === 'churn' ? 'Churn' : 'Complexity'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Size by</span>
                    <div className="flex gap-0.5 rounded bg-background p-0.5 ring-1 ring-border" role="group" aria-label="Size by">
                      {(['default', 'complexity'] as SizeMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          aria-pressed={sizeMode === mode}
                          onClick={() => setSizeMode(mode)}
                          className={`rounded px-1.5 py-0.5 text-xs font-semibold transition-all active:scale-[0.97] ${focusClass} ${
                            sizeMode === mode
                              ? 'bg-secondary text-foreground shadow-sm'
                              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
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

      <div className="relative">
        <button
          type="button"
          aria-expanded={activeDropdown === 'layout'}
          onClick={() => setActiveDropdown(activeDropdown === 'layout' ? null : 'layout')}
          className={toolbarButtonClass(activeDropdown === 'layout')}
        >
          <Workflow className="h-3.5 w-3.5" />
          <span>Layout</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {activeDropdown === 'layout' && (
          <DropdownPanel width="w-48">
            <div className="space-y-1">
              {(['tree', 'd3-tree-horiz', 'd3-tree-vert'] as LayoutType[]).map((type) => {
                const active = layoutType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setLayoutType(type);
                      setActiveDropdown(null);
                    }}
                    className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs transition-colors ${
                      active
                        ? "bg-secondary text-ui-active-text-green font-medium"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <span>{type === 'tree' ? 'Force layout' : type === 'd3-tree-horiz' ? 'Horizontal tree' : 'Vertical tree'}</span>
                    {active && <Check className="h-3 w-3 text-ui-active-text-green" />}
                  </button>
                );
              })}
            </div>
          </DropdownPanel>
        )}
      </div>

      {/* Export */}
      <div className="relative">
        <TooltipHint disabledTrigger={exportDisabled} content={exportDisabled ? 'Show some nodes before exporting' : 'Export graph'}><button
          type="button"
          disabled={exportDisabled}
          aria-expanded={activeDropdown === 'export'}
          onClick={() => setActiveDropdown(activeDropdown === 'export' ? null : 'export')}
          className={`${toolbarButtonClass(activeDropdown === 'export')} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button></TooltipHint>

        {activeDropdown === 'export' && !exportDisabled && (
          <DropdownPanel width="w-48">
            <button
              type="button"
              onClick={() => {
                handleExport("png");
                setActiveDropdown(null);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-secondary transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>PNG Image</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleExport("pdf");
                setActiveDropdown(null);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-secondary transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
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
        nodeColors={nodeColors}
      />
    </>
  );
}
