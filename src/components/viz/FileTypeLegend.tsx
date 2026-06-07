import { useMemo, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const [isMinimized, setIsMinimized] = useState(false);

  if (!counts.length) return null;

  return (
    <AnimatePresence mode="wait">
      {isMinimized ? (
        <motion.div
          key="minimized"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute bottom-3 right-0 z-10 hidden md:flex items-center"
        >
          <button
            onClick={() => setIsMinimized(false)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-l-md border border-r-0 border-white/5 bg-zinc-950/80 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white shadow-2xl backdrop-blur-md"
            title="Show file types"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="expanded"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute bottom-3 right-3 z-10 hidden md:block rounded-xl border border-white/5 bg-zinc-950/80 px-3.5 py-3 shadow-2xl backdrop-blur-md w-[170px]"
        >
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              File types
            </p>
            <button
              onClick={() => setIsMinimized(true)}
              className="cursor-pointer rounded text-zinc-500 hover:bg-white/10 hover:text-white transition-colors"
              title="Minimize"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
