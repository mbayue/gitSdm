import { useReactFlow } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { useVizStore } from '@/stores/vizStore';
import type { GraphNode, RepoAnalysis } from '@/types';
import { Layers, Network } from 'lucide-react';

interface AnalysisTabProps {
  analysis: RepoAnalysis;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  blastRadiusActive: boolean;
  blastRadiusIds: Set<string>;
  architecture?: {
    overview: string;
    layers: { name: string; description: string }[];
  } | null;
  architectureLoading?: boolean;
}

export function AnalysisTab({
  analysis,
  selectedNodeId,
  setSelectedNodeId,
  blastRadiusActive,
  blastRadiusIds,
  architecture,
  architectureLoading = false,
}: AnalysisTabProps) {
  const setFocusedFilePath = useVizStore((s) => s.setFocusedFilePath);
  const { getNode, setCenter } = useReactFlow();

  const selectedNode = selectedNodeId
    ? analysis.graph.nodes.find((n) => n.id === selectedNodeId)
    : null;

  const focusRelatedNode = (node: GraphNode) => {
    setSelectedNodeId(node.id);
    setFocusedFilePath(typeof node.data.path === 'string' ? node.data.path : null);

    window.setTimeout(() => {
      const target =
        getNode(node.id) ||
        (typeof node.data.path === 'string' ? getNode(`file:${node.data.path}`) : undefined) ||
        (typeof node.data.path === 'string' ? getNode(`folder:${node.data.path}`) : undefined);

      if (!target) return;

      const width =
        typeof target.measured?.width === "number"
          ? target.measured.width
          : target.width ?? 0;
      const height =
        typeof target.measured?.height === "number"
          ? target.measured.height
          : target.height ?? 0;

      setCenter(target.position.x + width / 2, target.position.y + height / 2, {
        duration: 480,
        zoom: 1.3,
      });
    }, 50);
  };

  return (
    <div className="space-y-6">
      {selectedNode ? (
        <div className="space-y-5">
          <div className="mb-2">
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest pl-1 mb-1.5 block font-mono">
              Selected Node
            </span>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-[15px] font-semibold text-zinc-100 truncate leading-tight pl-1">
                {selectedNode.data.label}
              </h3>
              {selectedNode.data.diffStatus && (
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border",
                  selectedNode.data.diffStatus === 'added' ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                    selectedNode.data.diffStatus === 'modified' ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                      "text-rose-400 bg-rose-500/10 border-rose-500/20"
                )}>
                  {selectedNode.data.diffStatus}
                </span>
              )}
            </div>

            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-3">Node Details</h4>
            <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500">Type</span>
                <span className="text-zinc-200 capitalize">{selectedNode.type}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500">Path</span>
                <span className="text-zinc-200 truncate max-w-[150px] text-right" title={selectedNode.data.path || ''}>{selectedNode.data.path || '-'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500">Extension</span>
                <span className="text-zinc-200 font-mono uppercase">{selectedNode.data.extension || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Degree</span>
                <span className="text-zinc-200 font-mono">
                  {analysis.graph.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} 
                  <span className="text-[10px] text-zinc-500 ml-1">
                    (In: {analysis.graph.edges.filter(e => e.target === selectedNode.id).length}, Out: {analysis.graph.edges.filter(e => e.source === selectedNode.id).length})
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest pl-1">
              {blastRadiusActive ? 'Affected Node' : 'Direct Relations'}
            </h4>
            <div className="space-y-1.5">
              {blastRadiusActive ? (
                Array.from(blastRadiusIds).filter(id => id !== selectedNode.id).length > 0 ? (
                  Array.from(blastRadiusIds)
                    .filter(id => id !== selectedNode.id)
                    .slice(0, 10)
                    .map(id => {
                      const node = analysis.graph.nodes.find(n => n.id === id);
                      if (!node) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => focusRelatedNode(node)}
                          className="w-full flex items-center justify-between p-2 rounded-xl bg-white/[0.015] border border-white/[0.03] hover:bg-white/[0.04] transition-colors group text-left"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 group-hover:bg-cyan-400 transition-colors shrink-0" />
                            <span className="text-[12px] text-zinc-300 truncate group-hover:text-white transition-colors">{node.data.label}</span>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-600 group-hover:text-zinc-400 shrink-0 ml-2">AFFECTED</span>
                        </button>
                      );
                    })
                ) : (
                  <div className="text-[11px] text-zinc-600 italic py-2 px-1">
                    No affected nodes.
                  </div>
                )
              ) : (
                <>
                  {analysis.graph.edges.filter(e => e.source === selectedNode.id).length === 0 && analysis.graph.edges.filter(e => e.target === selectedNode.id).length === 0 ? (
                    <div className="text-[11px] text-zinc-600 italic py-2 px-1">
                      No direct relations.
                    </div>
                  ) : (
                    <>
                      {analysis.graph.edges.filter(e => e.source === selectedNode.id).map(e => {
                        const target = analysis.graph.nodes.find(n => n.id === e.target);
                        if (!target) return null;
                        return (
                          <button
                            key={e.id}
                            onClick={() => focusRelatedNode(target)}
                            className="w-full flex items-center justify-between p-2 rounded-xl bg-white/[0.015] border border-white/[0.03] hover:bg-white/[0.04] transition-colors group text-left"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50 group-hover:bg-blue-400 transition-colors shrink-0" />
                              <span className="text-[12px] text-zinc-300 truncate group-hover:text-white transition-colors">{target.data.label}</span>
                            </div>
                            <span className="text-[9px] font-mono text-zinc-600 group-hover:text-zinc-400 shrink-0 ml-2">OUT</span>
                          </button>
                        );
                      })}
                      {analysis.graph.edges.filter(e => e.target === selectedNode.id).map(e => {
                        const source = analysis.graph.nodes.find(n => n.id === e.source);
                        if (!source) return null;
                        return (
                          <button
                            key={e.id}
                            onClick={() => focusRelatedNode(source)}
                            className="w-full flex items-center justify-between p-2 rounded-xl bg-white/[0.015] border border-white/[0.03] hover:bg-white/[0.04] transition-colors group text-left"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400/50 group-hover:bg-violet-400 transition-colors shrink-0" />
                              <span className="text-[12px] text-zinc-300 truncate group-hover:text-white transition-colors">{source.data.label}</span>
                            </div>
                            <span className="text-[9px] font-mono text-zinc-600 group-hover:text-zinc-400 shrink-0 ml-2">IN</span>
                          </button>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="mb-2">
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest pl-1 mb-1.5 block font-mono">
              Architecture Overview
            </span>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-[15px] font-semibold text-zinc-100 truncate leading-tight pl-1">
                Repository Architecture
              </h3>
            </div>

            <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-4 space-y-4 text-sm">
              {architectureLoading && !architecture ? (
                <div className="space-y-3">
                  <div className="h-3 w-2/3 rounded bg-white/[0.06] animate-pulse" />
                  <div className="h-3 w-full rounded bg-white/[0.04] animate-pulse" />
                  <div className="h-3 w-5/6 rounded bg-white/[0.04] animate-pulse" />
                </div>
              ) : architecture ? (
                <>
                  <p className="text-[12px] text-zinc-300 leading-relaxed">
                    {architecture.overview}
                  </p>

                  {architecture.layers.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-white/5">
                      <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                        System Layers
                      </h4>
                      {architecture.layers.map((layer, idx) => (
                        <div
                          key={`${layer.name}-${idx}`}
                          className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-3 space-y-1.5"
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                            <span className="text-[12px] font-semibold text-zinc-100">
                              {layer.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-relaxed">
                            {layer.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-3">
                  <div className="h-10 w-10 rounded-full bg-zinc-900/50 border border-white/5 flex items-center justify-center">
                    <Network className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-300">No Selection</p>
                    <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px] leading-relaxed">
                      Click on any file or folder in the graph to view its detailed analysis.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
