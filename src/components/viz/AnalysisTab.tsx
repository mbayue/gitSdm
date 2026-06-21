import { useReactFlow } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { useVizStore } from '@/stores/vizStore';
import type { GraphNode, RepoAnalysis } from '@/types';
import { Network } from 'lucide-react';

interface AnalysisTabProps {
  analysis: RepoAnalysis;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  blastRadiusActive: boolean;
  blastRadiusIds: Set<string>;
}

export function AnalysisTab({
  analysis,
  selectedNodeId,
  setSelectedNodeId,
  blastRadiusActive,
  blastRadiusIds,
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
            <span className="text-[10px] font-bold text-ui-active-text-green uppercase tracking-widest pl-1 mb-1.5 block font-mono">
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

            <h4 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest pl-1 mb-3">Node Details</h4>
            <div className="rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] px-3 py-2 space-y-2 text-[11px]">
              <div className="flex items-center justify-between border-b border-[rgba(240,246,252,0.1)] pb-1.5 pt-1">
                <span className="text-[#8b949e]">Path</span>
                <span className="text-[#e6edf3] font-mono truncate max-w-[150px] text-right" title={selectedNode.data.path || ''}>{selectedNode.data.path || '-'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[rgba(240,246,252,0.1)] pb-1.5 pt-1">
                <span className="text-[#8b949e]">Type</span>
                <span className="text-[#e6edf3] capitalize">{selectedNode.type}</span>
              </div>
              {selectedNode.data.extension && (
                <div className="flex items-center justify-between border-b border-[rgba(240,246,252,0.1)] pb-1.5 pt-1">
                  <span className="text-[#8b949e]">Extension</span>
                  <span className="text-[#e6edf3] font-mono">{selectedNode.data.extension}</span>
                </div>
              )}
              {selectedNode.data.path && selectedNode.data.path.includes('/') && (
                <div className="flex items-center justify-between border-b border-[rgba(240,246,252,0.1)] pb-1.5 pt-1">
                  <span className="text-[#8b949e]">Module</span>
                  <span className="text-[#e6edf3] font-mono truncate max-w-[150px] text-right" title={selectedNode.data.path.substring(0, selectedNode.data.path.lastIndexOf('/'))}>
                    {selectedNode.data.path.substring(0, selectedNode.data.path.lastIndexOf('/'))}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-[rgba(240,246,252,0.1)] pb-1.5 pt-1">
                <span className="text-[#8b949e]">Degree</span>
                <span className="text-[#e6edf3] font-mono">
                  {analysis.graph.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[rgba(240,246,252,0.1)] pb-1.5 pt-1">
                <span className="text-[#8b949e]">Imports (Out)</span>
                <span className="text-[#e6edf3] font-mono">
                  {analysis.graph.edges.filter(e => e.source === selectedNode.id).length}
                </span>
              </div>
              <div className="flex items-center justify-between border-[rgba(240,246,252,0.1)] pb-1 pt-1">
                <span className="text-[#8b949e]">Dependents (In)</span>
                <span className="text-[#e6edf3] font-mono">
                  {analysis.graph.edges.filter(e => e.target === selectedNode.id).length}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => {
                  if (selectedNode.data.path) {
                    navigator.clipboard.writeText(selectedNode.data.path);
                    useVizStore.getState().setToastMessage('Copied path to clipboard');
                  }
                }}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#161b22] border border-[rgba(240,246,252,0.1)] hover:border-[#58a6ff] hover:text-[#58a6ff] rounded-sm text-[10px] text-[#e6edf3] transition-all"
              >
                Copy Path
              </button>
              <button
                onClick={() => {
                  useVizStore.getState().setSidebarTab('ai');
                }}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#161b22] border border-[rgba(240,246,252,0.1)] hover:border-[#58a6ff] hover:text-[#58a6ff] rounded-sm text-[10px] text-[#e6edf3] transition-all"
              >
                Explain
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest pl-1">
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
                          className="w-full flex items-center justify-between p-2 rounded-md bg-[#0d1117] border border-[rgba(240,246,252,0.1)] hover:bg-[#1c2128] transition-colors group text-left"
                        >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#58a6ff]/50 group-hover:bg-[#58a6ff] transition-colors shrink-0" />
                              <span className="text-xs text-[#e6edf3] truncate transition-colors">{node.data.label}</span>
                            </div>
                            <span className="text-[9px] font-mono text-[#8b949e] shrink-0 ml-2">AFFECTED</span>
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
                            className="w-full flex items-center justify-between p-2 rounded-md bg-[#0d1117] border border-[rgba(240,246,252,0.1)] hover:bg-[#1c2128] transition-colors group text-left"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50 group-hover:bg-blue-400 transition-colors shrink-0" />
                              <span className="text-xs text-[#e6edf3] truncate transition-colors">{target.data.label}</span>
                            </div>
                            <span className="text-[9px] font-mono text-[#8b949e] shrink-0 ml-2">OUT</span>
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
                            className="w-full flex items-center justify-between p-2 rounded-md bg-[#0d1117] border border-[rgba(240,246,252,0.1)] hover:bg-[#1c2128] transition-colors group text-left"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#8b949e] group-hover:bg-[#e6edf3] transition-colors shrink-0" />
                              <span className="text-xs text-[#e6edf3] truncate transition-colors">{source.data.label}</span>
                            </div>
                            <span className="text-[9px] font-mono text-[#8b949e] shrink-0 ml-2">IN</span>
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
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-3">
          <div className="h-10 w-10 rounded-md bg-[#0d1117] border border-[rgba(240,246,252,0.1)] flex items-center justify-center">
            <Network className="h-4 w-4 text-[#8b949e]" />
          </div>
          <div>
            <p className="text-[11px] text-[#8b949e] leading-relaxed">
              Select a node to inspect file details, imports, dependents, and graph relationships.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
