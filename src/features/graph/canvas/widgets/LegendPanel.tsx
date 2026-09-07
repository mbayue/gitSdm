import { ChevronDown, Info, X } from 'lucide-react';

import type { ColorMode, SizeMode } from '@/stores/vizStore';
import type { NodeType } from '@/types';
import { NODE_TYPE_COLORS, GRAPH_NODE_PALETTES } from '../../force/forceGraphConstants';

interface LegendPanelProps {
  activeDropdown: 'filter' | 'display' | 'layout' | 'export' | 'legend' | null;
  setActiveDropdown: (dropdown: 'filter' | 'display' | 'layout' | 'export' | 'legend' | null) => void;
  compareBranch?: boolean;
  colorMode?: ColorMode;
  sizeMode?: SizeMode;
  blastRadiusActive?: boolean;
  nodeColors?: Partial<Record<NodeType, string>>;
}

const sectionHeaderClass = 'text-xs font-semibold text-foreground uppercase tracking-[0.14em] mb-2 font-mono';
const sectionClass = 'border-t border-border pt-3 first:border-t-0 first:pt-0';

const nodeTypeChips = [
  { label: 'Repo', type: 'repo' },
  { label: 'Folders', type: 'folder' },
  { label: 'Files', type: 'file' },
  { label: 'Packages', type: 'package' },
] as const;

const diffChips = [
  { label: 'Added', symbol: '+', ringColor: '#22c55e', textColor: 'text-success' },
  { label: 'Modified', symbol: '~', ringColor: '#f59e0b', textColor: 'text-warning' },
  { label: 'Deleted', symbol: '-', ringColor: '#ef4444', textColor: 'text-destructive' },
] as const;

const heatmapStops = [
  { label: 'Low', color: '#ffffff' },
  { label: 'Med', color: '#d97706' },
  { label: 'High', color: '#dc2626' },
] as const;

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <div className={sectionHeaderClass}>{children}</div>;
}

function LegendContent({
  compareBranch = false,
  colorMode = 'default',
  sizeMode = 'default',
  blastRadiusActive = false,
  onClose,
  nodeColors = {},
}: {
  compareBranch?: boolean;
  colorMode?: ColorMode;
  sizeMode?: SizeMode;
  blastRadiusActive?: boolean;
  onClose: () => void;
  nodeColors?: Partial<Record<NodeType, string>>;
}) {
  const overlayActive = colorMode !== 'default' || sizeMode !== 'default';
  const fileFill =
    colorMode === 'churn' || colorMode === 'complexity' ? GRAPH_NODE_PALETTES[colorMode][0] : NODE_TYPE_COLORS.file;

  return (
    <>
      <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
        <span className="text-xs font-semibold text-foreground">Graph Legend</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close legend"
          className="rounded text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ui-focus/70"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3 text-left">
        {/* Node Types — compact chips */}
        <div className={sectionClass}>
          <SectionHeader>Node Types</SectionHeader>
          <div className="flex gap-1">
            {nodeTypeChips.map((chip) => {
              const isFile = chip.label === 'Files';
              return (
              <div
                key={chip.label}
                className="flex flex-1 flex-col items-center gap-1 rounded bg-background px-1 py-1.5 ring-1 ring-border"
              >
                <span
                  className="rounded-full ring-1 ring-border"
                  style={{
                    width: isFile && sizeMode === 'complexity' ? 10 : 8,
                    height: isFile && sizeMode === 'complexity' ? 10 : 8,
                    backgroundColor: isFile ? fileFill : nodeColors[chip.type] ?? NODE_TYPE_COLORS[chip.type],
                  }}
                />
                <span className="text-xs font-medium text-muted-foreground">{chip.label}</span>
              </div>
              );
            })}
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeader>Connections</SectionHeader>
          <p className="text-xs text-muted-foreground">Arrows point from a folder to its contents, or from a file to a dependency it imports. Lines use the source node’s default color.</p>
        </div>

        {/* Diff status — compare mode only */}
        {compareBranch && (
          <div className={sectionClass}>
            <SectionHeader>Diff Status</SectionHeader>
            <div className="flex gap-1">
              {diffChips.map((chip) => (
                <div
                  key={chip.label}
                  className="flex flex-1 flex-col items-center gap-0.5 rounded bg-background px-1 py-1.5 ring-1 ring-border"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border bg-secondary"
                    style={{ borderColor: chip.ringColor }}
                  />
                  <span className={`text-xs font-bold font-mono ${chip.textColor}`}>{chip.symbol}</span>
                  <span className="text-xs text-muted-foreground">{chip.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health — always visible, compact */}
        <div className={sectionClass}>
          <SectionHeader>Health</SectionHeader>
          <div className="flex items-center gap-2 text-xs text-foreground">
            <span className="flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-extrabold text-zinc-950 select-none">
              !
            </span>
            <span>Outdated dependencies</span>
          </div>
        </div>

        {/* Node Overlay — scales with short explanations */}
        {overlayActive && (
          <div className={sectionClass}>
            <SectionHeader>Node Overlay</SectionHeader>

            {colorMode !== 'default' && sizeMode !== 'default' && (
              <p className="mb-2 text-xs text-muted-foreground leading-snug">
                <span className="text-foreground">Fill</span> = {colorMode === 'churn' ? 'churn heatmap' : 'complexity heatmap'}.
                {' '}<span className="text-foreground">Size</span> = complexity score.
              </p>
            )}
            {colorMode !== 'default' && sizeMode === 'default' && (
              <p className="mb-2 text-xs text-muted-foreground leading-snug">
                File <span className="text-foreground">fill color</span> reflects the scale below. Files without scores keep their default color.
              </p>
            )}
            {colorMode === 'default' && sizeMode !== 'default' && (
              <p className="mb-2 text-xs text-muted-foreground leading-snug">
                Node <span className="text-foreground">size</span> reflects complexity. Fill color stays the default file-type blue.
              </p>
            )}

            {colorMode === 'churn' && (
              <div className="mb-2.5">
                <div className="mb-0.5 text-xs font-medium text-foreground">Color — Churn</div>
                <p className="mb-1.5 text-xs text-muted-foreground leading-snug">
                  Commit frequency per file over the last 90 days.
                </p>
                <div className="flex items-end justify-between gap-2 rounded bg-background px-2 py-2 ring-1 ring-border">
                  {heatmapStops.map((stop) => (
                    <div key={stop.label} className="flex flex-col items-center gap-1">
                      <span
                        className="rounded-full ring-1 ring-border"
                        style={{ width: 8, height: 8, backgroundColor: stop.color }}
                      />
                      <span className="text-xs text-muted-foreground">{stop.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 flex items-start gap-2 text-xs leading-snug text-muted-foreground">
                  <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-dashed border-cyan-400" />
                  <span>
                    <span className="text-foreground">Dashed ring</span> — 3 or more authors edited this file (ownership risk).
                  </span>
                </div>
              </div>
            )}

            {colorMode === 'complexity' && (
              <div className="mb-2.5">
                <div className="mb-0.5 text-xs font-medium text-foreground">Color — Complexity</div>
                <p className="mb-1.5 text-xs text-muted-foreground leading-snug">
                  Score from lines of code, import count, and export count.
                </p>
                <div className="flex items-end justify-between gap-2 rounded bg-background px-2 py-2 ring-1 ring-border">
                  {heatmapStops.map((stop) => (
                    <div key={stop.label} className="flex flex-col items-center gap-1">
                      <span
                        className="rounded-full ring-1 ring-border"
                        style={{ width: 8, height: 8, backgroundColor: stop.color }}
                      />
                      <span className="text-xs text-muted-foreground">{stop.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sizeMode === 'complexity' && (
              <div>
                <div className="mb-0.5 text-xs font-medium text-foreground">Size — Complexity</div>
                <p className="mb-1.5 text-xs text-muted-foreground leading-snug">
                  Larger nodes = higher complexity score (same formula as color scale).
                </p>
                <div className="flex items-end justify-center gap-3 rounded bg-background px-2 py-2 ring-1 ring-border">
                  {[6, 9, 13].map((size, i) => (
                    <div key={size} className="flex flex-col items-center gap-1">
                      <span
                        className="rounded-full bg-blue-500"
                        style={{ width: size, height: size }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {i === 0 ? 'Low' : i === 1 ? 'Med' : 'High'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Focus & Selection — merged blast radius + interactive states */}
        <div className={sectionClass}>
          <SectionHeader>Focus & Selection</SectionHeader>
          <div className="space-y-1.5">
            {blastRadiusActive ? (
              <>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full border bg-popover"
                    style={{ borderColor: '#22d3ee', boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.18)' }}
                  />
                  <span>Selected node</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full border bg-popover"
                    style={{ borderColor: 'rgba(8,145,178,0.95)' }}
                  />
                  <span>Affected files and indirect dependents</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full border bg-secondary"
                    style={{ borderColor: '#a78bfa' }}
                  />
                  <span>Selected / focused</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full border bg-popover"
                    style={{ borderColor: 'rgba(139,92,246,0.4)' }}
                  />
                  <span>Neighbor</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full border border-border bg-background opacity-70" />
              <span>Dimmed</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function LegendPanel({
  activeDropdown,
  setActiveDropdown,
  compareBranch = false,
  colorMode = 'default',
  sizeMode = 'default',
  blastRadiusActive = false,
  nodeColors,
}: LegendPanelProps) {
  const legendOpen = activeDropdown === 'legend';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setActiveDropdown(legendOpen ? null : 'legend')}
        aria-expanded={legendOpen}
        aria-haspopup="true"
        className={`flex h-9 px-2.5 items-center gap-1.5 rounded-md text-sm font-medium transition-all active:scale-[0.95] ${
          legendOpen
            ? "bg-popover text-foreground border-border"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground border-transparent"
        }`}
      >
        <Info className="h-3.5 w-3.5" />
        <span>Legend</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {legendOpen && (
        <div className="graph-menu absolute right-0 mt-2 w-64 rounded-md border border-border bg-popover p-3 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 max-h-[calc(100vh-3rem)] overflow-y-auto">
          <LegendContent
            compareBranch={compareBranch}
            colorMode={colorMode}
            sizeMode={sizeMode}
            blastRadiusActive={blastRadiusActive}
            nodeColors={nodeColors}
            onClose={() => setActiveDropdown(null)}
          />
        </div>
      )}
    </div>
  );
}
