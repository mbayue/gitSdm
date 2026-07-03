import { ChevronDown, Info, X } from 'lucide-react';

import type { ColorMode, SizeMode } from '@/stores/vizStore';

interface LegendPanelProps {
  activeDropdown: 'filter' | 'display' | 'layout' | 'export' | 'legend' | null;
  setActiveDropdown: (dropdown: 'filter' | 'display' | 'layout' | 'export' | 'legend' | null) => void;
  compareBranch?: boolean;
  colorMode?: ColorMode;
  sizeMode?: SizeMode;
  blastRadiusActive?: boolean;
}

const sectionHeaderClass = 'text-[10px] font-semibold text-[#c9d1d9] uppercase tracking-[0.14em] mb-2 font-mono';
const sectionClass = 'border-t border-[rgba(240,246,252,0.08)] pt-3 first:border-t-0 first:pt-0';

const nodeTypeChips = [
  { label: 'Repo', dotClass: 'bg-violet-500' },
  { label: 'Folders', dotClass: 'bg-amber-500' },
  { label: 'Files', dotClass: 'bg-blue-500' },
] as const;

const diffChips = [
  { label: 'Added', symbol: '+', ringColor: '#22c55e', textColor: 'text-green-400' },
  { label: 'Modified', symbol: '~', ringColor: '#f59e0b', textColor: 'text-amber-400' },
  { label: 'Deleted', symbol: '-', ringColor: '#ef4444', textColor: 'text-red-400' },
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
}: {
  compareBranch?: boolean;
  colorMode?: ColorMode;
  sizeMode?: SizeMode;
  blastRadiusActive?: boolean;
  onClose: () => void;
}) {
  const overlayActive = colorMode !== 'default' || sizeMode !== 'default';
  const fileFill =
    colorMode === 'churn' || colorMode === 'complexity' ? '#ffffff' : '#3b82f6';

  return (
    <>
      <div className="flex items-center justify-between border-b border-[rgba(240,246,252,0.1)] pb-2 mb-3">
        <span className="text-xs font-semibold text-[#e6edf3]">Graph Legend</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close legend"
          className="rounded text-[#8b949e] hover:text-[#e6edf3] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ui-focus/70"
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
                className="flex flex-1 flex-col items-center gap-1 rounded bg-[#0d1117] px-1 py-1.5 ring-1 ring-[rgba(240,246,252,0.08)]"
              >
                <span
                  className={`rounded-full ${chip.dotClass}`}
                  style={{
                    width: isFile && sizeMode === 'complexity' ? 10 : 8,
                    height: isFile && sizeMode === 'complexity' ? 10 : 8,
                    ...(isFile ? { backgroundColor: fileFill } : {}),
                  }}
                />
                <span className="text-[9px] font-medium text-[#8b949e]">{chip.label}</span>
              </div>
              );
            })}
          </div>
        </div>

        {/* Diff status — compare mode only */}
        {compareBranch && (
          <div className={sectionClass}>
            <SectionHeader>Diff Status</SectionHeader>
            <div className="flex gap-1">
              {diffChips.map((chip) => (
                <div
                  key={chip.label}
                  className="flex flex-1 flex-col items-center gap-0.5 rounded bg-[#0d1117] px-1 py-1.5 ring-1 ring-[rgba(240,246,252,0.08)]"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border bg-[#1c2128]"
                    style={{ borderColor: chip.ringColor }}
                  />
                  <span className={`text-[10px] font-bold font-mono ${chip.textColor}`}>{chip.symbol}</span>
                  <span className="text-[8px] text-[#8b949e]">{chip.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health — always visible, compact */}
        <div className={sectionClass}>
          <SectionHeader>Health</SectionHeader>
          <div className="flex items-center gap-2 text-xs text-[#e6edf3]">
            <span className="flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[8px] font-extrabold text-zinc-950 select-none">
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
              <p className="mb-2 text-[10px] text-[#8b949e] leading-snug">
                <span className="text-[#c9d1d9]">Fill</span> = {colorMode === 'churn' ? 'churn heatmap' : 'complexity heatmap'}.
                {' '}<span className="text-[#c9d1d9]">Size</span> = complexity score.
              </p>
            )}
            {colorMode !== 'default' && sizeMode === 'default' && (
              <p className="mb-2 text-[10px] text-[#8b949e] leading-snug">
                Node <span className="text-[#c9d1d9]">fill color</span> reflects the scale below. Diff rings still show compare status.
              </p>
            )}
            {colorMode === 'default' && sizeMode !== 'default' && (
              <p className="mb-2 text-[10px] text-[#8b949e] leading-snug">
                Node <span className="text-[#c9d1d9]">size</span> reflects complexity. Fill color stays the default file-type blue.
              </p>
            )}

            {colorMode === 'churn' && (
              <div className="mb-2.5">
                <div className="mb-0.5 text-[10px] font-medium text-[#e6edf3]">Color — Churn</div>
                <p className="mb-1.5 text-[9px] text-[#8b949e] leading-snug">
                  Commit frequency per file over the last 90 days.
                </p>
                <div className="flex items-end justify-between gap-2 rounded bg-[#0d1117] px-2 py-2 ring-1 ring-[rgba(240,246,252,0.08)]">
                  {heatmapStops.map((stop) => (
                    <div key={stop.label} className="flex flex-col items-center gap-1">
                      <span
                        className="rounded-full"
                        style={{ width: 8, height: 8, backgroundColor: stop.color }}
                      />
                      <span className="text-[8px] text-[#8b949e]">{stop.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 flex items-start gap-2 text-[9px] leading-snug text-[#8b949e]">
                  <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-dashed border-cyan-400" />
                  <span>
                    <span className="text-[#c9d1d9]">Dashed ring</span> — 3 or more authors edited this file (ownership risk).
                  </span>
                </div>
              </div>
            )}

            {colorMode === 'complexity' && (
              <div className="mb-2.5">
                <div className="mb-0.5 text-[10px] font-medium text-[#e6edf3]">Color — Complexity</div>
                <p className="mb-1.5 text-[9px] text-[#8b949e] leading-snug">
                  Score from lines of code, import count, and export count.
                </p>
                <div className="flex items-end justify-between gap-2 rounded bg-[#0d1117] px-2 py-2 ring-1 ring-[rgba(240,246,252,0.08)]">
                  {heatmapStops.map((stop) => (
                    <div key={stop.label} className="flex flex-col items-center gap-1">
                      <span
                        className="rounded-full"
                        style={{ width: 8, height: 8, backgroundColor: stop.color }}
                      />
                      <span className="text-[8px] text-[#8b949e]">{stop.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sizeMode === 'complexity' && (
              <div>
                <div className="mb-0.5 text-[10px] font-medium text-[#e6edf3]">Size — Complexity</div>
                <p className="mb-1.5 text-[9px] text-[#8b949e] leading-snug">
                  Larger nodes = higher complexity score (same formula as color scale).
                </p>
                <div className="flex items-end justify-center gap-3 rounded bg-[#0d1117] px-2 py-2 ring-1 ring-[rgba(240,246,252,0.08)]">
                  {[6, 9, 13].map((size, i) => (
                    <div key={size} className="flex flex-col items-center gap-1">
                      <span
                        className="rounded-full bg-blue-500"
                        style={{ width: size, height: size }}
                      />
                      <span className="text-[8px] text-[#8b949e]">
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
                <div className="flex items-center gap-2 text-xs text-[#e6edf3]">
                  <span
                    className="h-2.5 w-2.5 rounded-full border bg-[#161b22]"
                    style={{ borderColor: '#22d3ee', boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.18)' }}
                  />
                  <span>Selected node</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#e6edf3]">
                  <span
                    className="h-2.5 w-2.5 rounded-full border bg-[#161b22]"
                    style={{ borderColor: 'rgba(8,145,178,0.95)' }}
                  />
                  <span>Connected nodes</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs text-[#e6edf3]">
                  <span
                    className="h-2.5 w-2.5 rounded-full border bg-[#1c2128]"
                    style={{ borderColor: '#a78bfa' }}
                  />
                  <span>Selected / focused</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#e6edf3]">
                  <span
                    className="h-2.5 w-2.5 rounded-full border bg-[#161b22]"
                    style={{ borderColor: 'rgba(230, 237, 243, 0.2)' }}
                  />
                  <span>Neighbor</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2 text-xs text-[#8b949e]">
              <span className="h-2.5 w-2.5 rounded-full border border-white/10 bg-[#0d1117] opacity-70" />
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
}: LegendPanelProps) {
  const legendOpen = activeDropdown === 'legend';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setActiveDropdown(legendOpen ? null : 'legend')}
        aria-expanded={legendOpen}
        aria-haspopup="true"
        className={`flex h-8 px-2.5 items-center gap-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.95] ${
          legendOpen
            ? "bg-[#161b22] text-[#e6edf3] border-[rgba(240,246,252,0.1)]"
            : "text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3] border-transparent"
        }`}
      >
        <Info className="h-3.5 w-3.5" />
        <span>Legend</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {legendOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] p-3 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 max-h-[calc(100vh-3rem)] overflow-y-auto">
          <LegendContent
            compareBranch={compareBranch}
            colorMode={colorMode}
            sizeMode={sizeMode}
            blastRadiusActive={blastRadiusActive}
            onClose={() => setActiveDropdown(null)}
          />
        </div>
      )}
    </div>
  );
}
