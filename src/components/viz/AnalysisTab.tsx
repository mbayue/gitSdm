import { TooltipHint } from '@/components/ui/tooltip';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useVizStore } from '@/stores/vizStore';
import type { GraphData, GraphEdge, GraphNode, RepoAnalysis } from '@/types';
import { getFileContext } from '@/lib/file-context';
import { copyToClipboard } from '@/lib/clipboard';
import { Network } from 'lucide-react';

/**
 * Pure relation logic for the Analysis tab (testable without rendering).
 *
 * Matches the tested `getFileContext` semantics for files: excludes
 * `contains` + self-loops, dedups by opposite endpoint, and drops edges
 * whose opposite endpoint is missing from the graph. For non-file nodes
 * (folder/repo/package) containment edges ARE the relations, so they are
 * included instead of excluded.
 */
export function getAnalysisRelations(graph: GraphData, selectedNodeId: string | null): {
  outgoing: GraphEdge[];
  incoming: GraphEdge[];
} {
  if (!selectedNodeId) return { outgoing: [], incoming: [] };
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const selected = nodeById.get(selectedNodeId);
  if (!selected) return { outgoing: [], incoming: [] };
  const isFile = selected.type === 'file';
  const rawOutgoing = graph.edges.filter(
    (edge) =>
      edge.source === selected.id &&
      edge.source !== edge.target &&
      (isFile ? edge.type !== 'contains' : true) &&
      nodeById.has(edge.target),
  );
  const rawIncoming = graph.edges.filter(
    (edge) =>
      edge.target === selected.id &&
      edge.source !== edge.target &&
      (isFile ? edge.type !== 'contains' : true) &&
      nodeById.has(edge.source),
  );
  const outgoing = rawOutgoing.filter(
    (edge, index) => rawOutgoing.findIndex((e) => e.target === edge.target) === index,
  );
  const incoming = rawIncoming.filter(
    (edge, index) => rawIncoming.findIndex((e) => e.source === edge.source) === index,
  );
  return { outgoing, incoming };
}

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

  // ⚡ Bolt: Use a Map for O(1) node lookups instead of O(N) array .find() calls inside render loops
  const nodeById = useMemo(() => new Map(analysis.graph.nodes.map(n => [n.id, n])), [analysis.graph.nodes]);

  const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) : null;

  const { outgoing, incoming } = useMemo(
    () => getAnalysisRelations(analysis.graph, selectedNodeId),
    [analysis.graph, selectedNodeId],
  );
  const fileContext = selectedNode?.type === 'file' && selectedNode.data.path ? getFileContext(analysis.graph, selectedNode.data.path) : null;

  const focusRelatedNode = (node: GraphNode) => {
    setSelectedNodeId(node.id);
    setFocusedFilePath(
      node.type === "file" && typeof node.data.path === "string"
        ? node.data.path
        : null,
    );
  };

  return (
    <div className="space-y-6">
      {selectedNode ? (
        <div className="space-y-5">
          <div className="mb-2">
            <span className="text-xs font-bold text-ui-active-text-green uppercase tracking-widest pl-1 mb-1.5 block font-mono">
              Selected Node
            </span>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-[15px] font-semibold text-foreground truncate leading-tight pl-1">
                {selectedNode.data.label}
              </h3>
              {selectedNode.data.diffStatus && (
                <span className={cn(
                  "text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border",
                  selectedNode.data.diffStatus === 'added' ? "text-success bg-emerald-500/10 border-emerald-500/20" :
                    selectedNode.data.diffStatus === 'modified' ? "text-warning bg-amber-500/10 border-amber-500/20" :
                      "text-destructive bg-rose-500/10 border-rose-500/20"
                )}>
                  {selectedNode.data.diffStatus}
                </span>
              )}
            </div>

            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-3">File context</h4>
            {fileContext && <p className="mb-3 text-sm text-foreground">{fileContext.role}</p>}
            <div className="rounded-md border border-border bg-background px-3 py-2 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-border pb-1.5 pt-1">
                <span className="text-muted-foreground">Path</span>
                <TooltipHint content={selectedNode.data.path || ''}><span className="text-foreground font-mono truncate max-w-[150px] text-right">{selectedNode.data.path || '-'}</span></TooltipHint>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-1.5 pt-1">
                <span className="text-muted-foreground">Type</span>
                <span className="text-foreground capitalize">{selectedNode.type}</span>
              </div>
              {selectedNode.data.extension && (
                <div className="flex items-center justify-between border-b border-border pb-1.5 pt-1">
                  <span className="text-muted-foreground">Extension</span>
                  <span className="text-foreground font-mono">{selectedNode.data.extension}</span>
                </div>
              )}
              {selectedNode.data.path && selectedNode.data.path.includes('/') && (
                <div className="flex items-center justify-between border-b border-border pb-1.5 pt-1">
                  <span className="text-muted-foreground">Module</span>
                  <TooltipHint content={selectedNode.data.path.substring(0, selectedNode.data.path.lastIndexOf('/'))}><span className="text-foreground font-mono truncate max-w-[150px] text-right">
                    {selectedNode.data.path.substring(0, selectedNode.data.path.lastIndexOf('/'))}
                  </span></TooltipHint>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-border pb-1.5 pt-1">
                <span className="text-muted-foreground">Degree</span>
                <span className="text-foreground font-mono">
                  {analysis.graph.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-1.5 pt-1">
                <span className="text-muted-foreground">Dependencies</span>
                <span className="text-foreground font-mono">
                  {outgoing.length}
                </span>
              </div>
              <div className="flex items-center justify-between border-border pb-1 pt-1">
                <span className="text-muted-foreground">Used by</span>
                <span className="text-foreground font-mono">
                  {incoming.length}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={async () => {
                  if (!selectedNode.data.path) return;
                  try {
                    await copyToClipboard(selectedNode.data.path);
                    useVizStore.getState().setToastMessage('Copied path to clipboard');
                  } catch {
                    useVizStore.getState().setToastMessage('Could not copy the file path.');
                  }
                }}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-card border border-border hover:border-accent hover:text-accent rounded-sm text-xs text-foreground transition-all"
              >
                Copy Path
              </button>
              <button
                onClick={() => {
                  useVizStore.getState().setSidebarTab('ai');
                }}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-card border border-border hover:border-accent hover:text-accent rounded-sm text-xs text-foreground transition-all"
              >
                Explain
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">
              {blastRadiusActive ? 'Affected Node' : 'Direct Relations'}
            </h4>
            <div className="space-y-1.5">
              {blastRadiusActive ? (
                Array.from(blastRadiusIds).filter(id => id !== selectedNode.id).length > 0 ? (
                  Array.from(blastRadiusIds)
                    .filter(id => id !== selectedNode.id)
                    .map(id => {
                      const node = nodeById.get(id);
                      if (!node) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => focusRelatedNode(node)}
                          className="w-full flex items-center justify-between p-2 rounded-md bg-background border border-border hover:bg-popover transition-colors group text-left"
                        >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent/50 group-hover:bg-accent transition-colors shrink-0" />
                              <span className="text-xs text-foreground truncate transition-colors">{node.data.label}</span>
                            </div>
                            <span className="text-xs font-mono text-muted-foreground shrink-0 ml-2">AFFECTED</span>
                        </button>
                      );
                    })
                ) : (
                  <div className="text-xs text-muted-foreground italic py-2 px-1">
                    No affected nodes.
                  </div>
                )
              ) : (
                <>
                  {outgoing.length === 0 && incoming.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic py-2 px-1">
                      No direct relations.
                    </div>
                  ) : (
                    <>
                      {outgoing.map(e => {
                        const target = nodeById.get(e.target);
                        if (!target) return null;
                        return (
                          <button
                            key={e.id}
                            onClick={() => focusRelatedNode(target)}
                            className="w-full flex items-center justify-between p-2 rounded-md bg-background border border-border hover:bg-popover transition-colors group text-left"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50 group-hover:bg-blue-400 transition-colors shrink-0" />
                              <span className="text-xs text-foreground truncate transition-colors">{target.data.label}</span>
                            </div>
                            <span className="text-xs font-mono text-muted-foreground shrink-0 ml-2">DEPENDS ON</span>
                          </button>
                        );
                      })}
                      {incoming.map(e => {
                        const source = nodeById.get(e.source);
                        if (!source) return null;
                        return (
                          <button
                            key={e.id}
                            onClick={() => focusRelatedNode(source)}
                            className="w-full flex items-center justify-between p-2 rounded-md bg-background border border-border hover:bg-popover transition-colors group text-left"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground group-hover:bg-foreground transition-colors shrink-0" />
                              <span className="text-xs text-foreground truncate transition-colors">{source.data.label}</span>
                            </div>
                            <span className="text-xs font-mono text-muted-foreground shrink-0 ml-2">USED BY</span>
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
          <div className="h-10 w-10 rounded-md bg-background border border-border flex items-center justify-center">
            <Network className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select a node to inspect file details, imports, dependents, and graph relationships.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
