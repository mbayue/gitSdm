import { useState } from 'react';
import { useVizStore } from '@/stores/viz-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star, Trash2, X, ChevronDown, ChevronUp, Layers, HelpCircle } from 'lucide-react';


export interface GraphDiff {
  added: Set<string>;
  modified: Set<string>;
  deleted: Set<string>;
}

interface CompareHUDProps {
  diff: GraphDiff | null;
  defaultBranch: string;
}

export function CompareHUD({ diff, defaultBranch }: CompareHUDProps) {
  const { compareBranch, selectedBranch, setCompareBranch } = useVizStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!compareBranch || !diff) return null;

  const baseBranch = selectedBranch || defaultBranch;
  const totalChanges = diff.added.size + diff.modified.size + diff.deleted.size;

  const addedArray = Array.from(diff.added);
  const modifiedArray = Array.from(diff.modified);
  const deletedArray = Array.from(diff.deleted);

  return (
    <div className="absolute left-4 bottom-16 z-20 w-80 font-sans">
      <div className="rounded-xl border border-zinc-800/40 bg-zinc-950/95 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800/20 bg-zinc-900/40 select-none">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-500" />
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-zinc-200 leading-none">Branch Compare</span>
              <span className="text-[9px] text-zinc-400 mt-0.5">
                {baseBranch} ↔ {compareBranch}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded hover:bg-zinc-800/50 text-zinc-400 transition-colors"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setCompareBranch(null)}
              className="p-1 rounded hover:bg-zinc-800/50 text-zinc-400 transition-colors"
              title="Close Compare Mode"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-1 px-3 py-3 border-b border-zinc-800/20 bg-zinc-900/20">
                <div className="flex flex-col items-center justify-center p-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.02]">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Added</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {diff.added.size}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-1.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.02]">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Modified</span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                    {diff.modified.size}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-1.5 rounded-lg border border-red-500/20 bg-red-500/[0.02]">
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">Deleted</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400 font-mono mt-0.5">
                    {diff.deleted.size}
                  </span>
                </div>
              </div>

              {/* Detailed lists */}
              <div className="p-3 max-h-60 overflow-y-auto space-y-3.5 custom-scrollbar">
                {totalChanges === 0 ? (
                  <div className="text-center py-6 text-xs text-zinc-400">
                    No architecture differences found between these branches.
                  </div>
                ) : (
                  <>
                    {/* Added files list */}
                    {addedArray.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5">
                          <Plus className="h-3 w-3" />
                          <span>Added Modules ({addedArray.length})</span>
                        </div>
                        <ul className="space-y-1">
                          {addedArray.map((path) => (
                            <li
                                key={path}
                                className="text-[10px] font-mono truncate text-zinc-300 bg-emerald-500/[0.04] px-1.5 py-0.5 rounded border border-emerald-500/10"
                                title={path}
                              >
                              {path}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Modified files list */}
                    {modifiedArray.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1.5">
                          <Star className="h-3 w-3" />
                          <span>Modified Modules ({modifiedArray.length})</span>
                        </div>
                        <ul className="space-y-1">
                          {modifiedArray.map((path) => (
                            <li
                                key={path}
                                className="text-[10px] font-mono truncate text-zinc-300 bg-amber-500/[0.04] px-1.5 py-0.5 rounded border border-amber-500/10"
                                title={path}
                              >
                              {path}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Deleted files list */}
                    {deletedArray.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1.5">
                          <Trash2 className="h-3 w-3" />
                          <span>Deleted Modules ({deletedArray.length})</span>
                        </div>
                        <ul className="space-y-1">
                          {deletedArray.map((path) => (
                            <li
                                key={path}
                                className="text-[10px] font-mono truncate text-zinc-400 line-through bg-red-500/[0.04] px-1.5 py-0.5 rounded border border-red-500/10"
                                title={path}
                              >
                              {path}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Instructions badge */}
              <div className="px-3.5 py-2.5 bg-zinc-900/50 border-t border-zinc-800/20 flex items-center gap-1.5 text-[10px] text-zinc-400">
                <HelpCircle className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span>Changed modules are highlighted colored in the graph canvas.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
