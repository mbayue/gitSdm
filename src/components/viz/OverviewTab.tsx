import { cn } from '@/lib/utils';
import { useVizStore } from '@/stores/vizStore';
import type { RepoAnalysis } from '@/types';
import {
  Plus, Activity, AlertTriangle, GitBranch,
  FileCode, Folder, Package, Users, Code2, GitFork, Star, ShieldAlert
} from 'lucide-react';

interface OverviewTabProps {
  analysis: RepoAnalysis;
  selectedBranch: string | null;
  graphDiff?: {
    added: Set<string>;
    modified: Set<string>;
    deleted: Set<string>;
  } | null;
}

export function OverviewTab({ analysis, selectedBranch, graphDiff }: OverviewTabProps) {
  const setSelectedNodeId = useVizStore(state => state.setSelectedNodeId);

  const fileCount = analysis.graph.nodes.filter(n => n.type === 'file').length;
  const folderCount = analysis.graph.nodes.filter(n => n.type === 'folder').length;
  const depCount = analysis.dependencies.length;
  const contributorCount = analysis.contributors.length;

  return (
    <div className="space-y-5">
      {useVizStore.getState().compareBranch && graphDiff ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.04] bg-black/20 p-3.5 group hover:border-white/[0.08] transition-all">
              <div className="flex items-center justify-between mb-2.5">
                <Plus className="h-4 w-4 text-emerald-400" />
                <span className="text-[15px] font-semibold text-zinc-200 font-mono">{graphDiff.added.size}</span>
              </div>
              <span className="text-[9px] text-zinc-500 uppercase font-semibold tracking-widest block">Added</span>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-black/20 p-3.5 group hover:border-white/[0.08] transition-all">
              <div className="flex items-center justify-between mb-2.5">
                <Activity className="h-4 w-4 text-amber-400" />
                <span className="text-[15px] font-semibold text-zinc-200 font-mono">{graphDiff.modified.size}</span>
              </div>
              <span className="text-[9px] text-zinc-500 uppercase font-semibold tracking-widest block">Modified</span>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-black/20 p-3.5 group hover:border-white/[0.08] transition-all">
              <div className="flex items-center justify-between mb-2.5">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span className="text-[15px] font-semibold text-zinc-200 font-mono">{graphDiff.deleted.size}</span>
              </div>
              <span className="text-[9px] text-zinc-500 uppercase font-semibold tracking-widest block">Deleted</span>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-black/20 p-3.5 group hover:border-white/[0.08] transition-all">
              <div className="flex items-center justify-between mb-2.5">
                <GitBranch className="h-4 w-4 text-violet-400" />
                <span className="text-[15px] font-semibold text-zinc-200 font-mono">
                  {graphDiff.added.size + graphDiff.modified.size + graphDiff.deleted.size}
                </span>
              </div>
              <span className="text-[9px] text-zinc-500 uppercase font-semibold tracking-widest block">Total Changes</span>
            </div>
          </div>

          <div className="space-y-4">
            {graphDiff.added.size > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">
                  <Plus className="w-3 h-3" /> Added Files
                </h4>
                <div className="rounded-xl border border-white/5 bg-zinc-900/30 py-2 space-y-0.5 max-h-[200px] overflow-y-auto scrollbar-thin">
                  {Array.from(graphDiff.added).map(id => {
                    const node = analysis.graph.nodes.find(n => n.id === id);
                    return (
                      <button 
                        key={id} 
                        onClick={() => {
                          if (node) {
                            setSelectedNodeId(id);
                          }
                          useVizStore.getState().setFocusedFilePath(id);
                          useVizStore.getState().setInspectorOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-xs text-zinc-300 font-mono truncate transition-colors"
                      >
                        {node?.data.path || id}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {graphDiff.modified.size > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">
                  <Activity className="w-3 h-3" /> Modified Files
                </h4>
                <div className="rounded-xl border border-white/5 bg-zinc-900/30 py-2 space-y-0.5 max-h-[200px] overflow-y-auto scrollbar-thin">
                  {Array.from(graphDiff.modified).map(id => {
                    const node = analysis.graph.nodes.find(n => n.id === id);
                    return (
                      <button 
                        key={id} 
                        onClick={() => {
                          if (node) {
                            setSelectedNodeId(id);
                          }
                          useVizStore.getState().setFocusedFilePath(id);
                          useVizStore.getState().setInspectorOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-xs text-zinc-300 font-mono truncate transition-colors"
                      >
                        {node?.data.path || id}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {graphDiff.deleted.size > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">
                  <AlertTriangle className="w-3 h-3" /> Deleted Files
                </h4>
                <div className="rounded-xl border border-white/5 bg-zinc-900/30 py-2 space-y-0.5 max-h-[200px] overflow-y-auto scrollbar-thin">
                  {Array.from(graphDiff.deleted).map(id => {
                    const node = analysis.graph.nodes.find(n => n.id === id);
                    return (
                      <button
                        key={id} 
                        onClick={() => {
                          useVizStore.getState().setFocusedFilePath(id);
                          useVizStore.getState().setInspectorOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-xs text-zinc-500 font-mono truncate line-through transition-colors"
                      >
                        {node?.data.path || id}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-4.5 shadow-sm">
            <h3 className="text-[16px] font-semibold text-zinc-100 leading-tight">
              {analysis.meta.repo}
            </h3>
            <p className="mt-2 text-[11px] text-zinc-500 leading-relaxed line-clamp-3">
              {analysis.meta.description || 'No description provided.'}
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium bg-black/20 border border-white/[0.03] rounded-md px-2.5 py-1">
                <Code2 className="h-3 w-3 text-blue-400" />
                <span>{analysis.meta.language || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium bg-black/20 border border-white/[0.03] rounded-md px-2.5 py-1">
                <GitBranch className="h-3 w-3 text-violet-400" />
                <span>{selectedBranch || analysis.meta.defaultBranch || 'main'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium bg-black/20 border border-white/[0.03] rounded-md px-2.5 py-1" title="Stars">
                <Star className="h-3 w-3 text-amber-400" />
                <span>{analysis.meta.stars?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium bg-black/20 border border-white/[0.03] rounded-md px-2.5 py-1" title="Forks">
                <GitFork className="h-3 w-3 text-zinc-400" />
                <span>{analysis.meta.forks?.toLocaleString() || 0}</span>
              </div>
              {analysis.meta.license && (
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium bg-black/20 border border-white/[0.03] rounded-md px-2.5 py-1">
                  <ShieldAlert className="h-3 w-3 text-emerald-400" />
                  <span>{analysis.meta.license}</span>
                </div>
              )}
            </div>

            {analysis.meta.topics && analysis.meta.topics.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {analysis.meta.topics.slice(0, 5).map(topic => (
                  <span key={topic} className="px-2 py-0.5 bg-blue-500/10 text-blue-300 text-[9px] rounded-full border border-blue-500/20 font-mono max-w-[120px] truncate" title={topic}>
                    {topic}
                  </span>
                ))}
                {analysis.meta.topics.length > 5 && (
                  <span className="px-2 py-0.5 bg-zinc-500/10 text-zinc-400 text-[9px] rounded-full border border-zinc-500/20 font-mono shrink-0">
                    +{analysis.meta.topics.length - 5}
                  </span>
                )}
              </div>
            )}

            <div className="mt-3.5 text-[9px] text-zinc-600 font-mono flex items-center justify-between">
              <span>Updated: {new Date(analysis.meta.updatedAt).toLocaleDateString()}</span>
              <span>Created: {new Date(analysis.meta.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Files', val: fileCount, icon: FileCode, color: 'text-blue-400' },
              { label: 'Folders', val: folderCount, icon: Folder, color: 'text-amber-400' },
              { label: 'Dependencies', val: depCount, icon: Package, color: 'text-violet-400' },
              { label: 'Contributors', val: contributorCount, icon: Users, color: 'text-pink-400' },
            ].map((stat, idx) => (
              <div key={idx} className="rounded-xl border border-white/[0.04] bg-black/20 p-3 group hover:border-white/[0.08] transition-all">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                  <span className="text-[15px] font-semibold text-zinc-200 font-mono">{stat.val}</span>
                </div>
                <span className="text-[9px] text-zinc-500 uppercase font-semibold tracking-widest block">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Commit Density</h4>
              <div className="flex items-center gap-2">
                {analysis.timeline.length > 0 && (
                  <span className="text-[9px] text-zinc-600 font-mono">
                    Max: {Math.max(...analysis.timeline.map(w => w.count))}
                  </span>
                )}
                <Activity className="h-3 w-3 text-violet-400/60" />
              </div>
            </div>
            {analysis.timeline.length === 0 ? (
              <div className="h-14 flex items-center justify-center text-[11px] text-zinc-600 italic">
                No commit history available.
              </div>
            ) : (
              <div className="flex items-end gap-1.5 h-14">
                {analysis.timeline.slice(-20).map((week, idx) => {
                  const maxCount = Math.max(1, Math.max(...analysis.timeline.map(w => w.count)));
                  const ratio = week.count / maxCount;
                  const heightPercentage = Math.max(10, ratio * 100);
                  const opacity = Math.max(0.3, ratio);

                  return (
                    <div
                      key={idx}
                      className="group relative flex-1 rounded-t-sm transition-all"
                      style={{
                        height: `${heightPercentage}%`,
                        backgroundColor: `rgba(139, 92, 246, ${opacity})`
                      }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none z-50">
                        <div className="bg-zinc-900 border border-white/10 text-zinc-200 text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-xl">
                          <span className="font-semibold text-violet-300">{week.count}</span> commits
                          <div className="text-[9px] text-zinc-500 mt-0.5">{new Date(week.week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
