import { useMemo } from 'react';
import type { GraphData } from '@/types';
import { LEGEND_EXT_COLORS } from '@/features/graph/node-colors';

export function FileTypeLegend({ graph }: { graph: GraphData }) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const node of graph.nodes) {
      if (node.type !== 'file') continue;
      const ext = node.data.extension ?? node.data.label?.split('.').pop()?.toLowerCase() ?? '?';
      map.set(ext, (map.get(ext) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [graph]);

  if (!counts.length) return null;

  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-md border border-white/15 bg-black/85 px-3 py-2.5 shadow-xl">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        File types
      </p>
      <ul className="space-y-1.5">
        {counts.map(([ext, count]) => (
          <li key={ext} className="flex items-center gap-2.5 text-[11px] text-zinc-300">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: LEGEND_EXT_COLORS[ext] ?? '#a1a1aa' }}
            />
            <span className="font-mono text-white">.{ext}</span>
            <span className="ml-auto tabular-nums text-zinc-500">({count})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
