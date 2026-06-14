import { Info, X } from 'lucide-react';

interface LegendPanelProps {
  legendOpen: boolean;
  setLegendOpen: (open: boolean) => void;
}

export function LegendPanel({ legendOpen, setLegendOpen }: LegendPanelProps) {
  return (
    <div className="absolute bottom-4 left-4 z-20 font-sans">
      <button
        type="button"
        onClick={() => setLegendOpen(!legendOpen)}
        className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all active:scale-[0.95] ${
          legendOpen
            ? "bg-zinc-900 text-zinc-250 border-white/10 shadow-inner"
            : "border-white/[0.06] bg-zinc-950/80 text-zinc-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        <Info className="h-3.5 w-3.5" />
        <span>Legend</span>
      </button>

      {legendOpen && (
        <div className="absolute bottom-10 left-0 w-64 rounded-xl border border-white/[0.06] bg-zinc-950/90 p-3 shadow-md backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-3">
            <span className="text-xs font-semibold text-zinc-200">Graph Legend</span>
            <button
              type="button"
              onClick={() => setLegendOpen(false)}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-left">
            {/* Node Types */}
            <div>
              <div className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 font-mono">Node Types</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                  <span>Repository</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  <span>Folders</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span>File Node</span>
                </div>
              </div>
            </div>

            {/* Status Changes */}
            <div>
              <div className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 font-mono">Status Changes</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold">+</span>
                  <span>Added File</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold">~</span>
                  <span>Modified File</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold">-</span>
                  <span className="line-through text-zinc-500">Deleted File</span>
                </div>
              </div>
            </div>

            {/* Interactive States */}
            <div>
              <div className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 font-mono">Interactive States</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="h-3 w-8 rounded border border-violet-400 bg-zinc-900 shadow-[0_0_8px_rgba(167,139,250,0.4)]" />
                  <span>Selected / Focus Node</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="h-3 w-8 rounded border border-violet-500/40 bg-zinc-950 shadow-[0_0_4px_rgba(139,92,246,0.15)]" />
                  <span>Neighbor Connections</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="h-3 w-8 rounded border border-white/5 bg-zinc-950/40 opacity-40" />
                  <span>Unrelated (Dimmed)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
