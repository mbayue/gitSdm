import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  ReactFlow,
  Controls,
  Panel,
  Background,
  BackgroundVariant,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Node,
  type Edge,
  type DefaultEdgeOptions,
} from '@xyflow/react';
import { FolderGit2, Folder, FileCode, Download, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { cn } from '@/lib/utils';
import '@xyflow/react/dist/style.css';
import { RepoNode, FolderNode, FileNode, PackageNode, ContributorNode } from './nodes';

const nodeTypes = {
  repo: RepoNode,
  folder: FolderNode,
  file: FileNode,
  package: PackageNode,
  contributor: ContributorNode,
};
import type { GraphData, GraphNode } from '@/types';
import { useVizStore } from '@/stores/viz-store';
import { getLayoutedElements } from './layout-client';

interface GraphCanvasProps {
  graph: GraphData;
  readOnly?: boolean;
}

export function GraphCanvas({ graph, readOnly }: GraphCanvasProps) {
  const {
    searchQuery,
    nodeTypeFilters,
    toggleNodeTypeFilter,
    diffStatusFilters,
    toggleDiffStatusFilter,
    selectedNodeId,
    highlightedNodeIds,
    setSelectedNodeId,
    setHighlightedNodeIds,
    focusedFilePath,
    setFocusedFilePath,
    setInspectorOpen,
    layoutType,
    theme,
    activeFocusLayer,
    compareBranch,
  } = useVizStore();

  const reactFlowInstance = useReactFlow();
  const { fitView, setCenter } = reactFlowInstance;
  const isDark = theme === 'dark';

  const flowStyle = useMemo(() => ({
    '--xy-background-color': isDark ? '#0f1015' : '#f9fafb',
    '--xy-controls-button-background-color': isDark ? 'rgba(24, 24, 27, 0.72)' : 'rgba(255, 255, 255, 0.86)',
    '--xy-controls-button-background-color-hover': isDark ? 'rgba(39, 39, 42, 0.95)' : 'rgba(244, 244, 245, 0.95)',
    '--xy-controls-button-color': isDark ? 'rgba(244, 244, 245, 0.78)' : 'rgba(39, 39, 42, 0.78)',
    '--xy-controls-button-color-hover': isDark ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)',
  }) as CSSProperties, [isDark]);

  const defaultEdgeOptions = useMemo<DefaultEdgeOptions>(() => ({
    type: layoutType === 'force' ? 'straight' : 'smoothstep',
    style: {
      stroke: theme === 'dark' ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.15)',
      strokeWidth: theme === 'dark' ? 1.35 : 1.2,
    },
  }), [theme, layoutType]);

  const filtered = useMemo(() => {
    if (readOnly) return graph;
    const q = searchQuery.toLowerCase();
    const activeFilters = nodeTypeFilters;

    let nodes = graph.nodes.filter((n) => activeFilters.has(n.type));

    // Apply diff status filters if any are active
    if (diffStatusFilters.size > 0) {
      const matchingFilePaths = new Set(
        graph.nodes
          .filter((n) => n.type === 'file' && n.data.diffStatus && diffStatusFilters.has(n.data.diffStatus))
          .map((n) => n.data.path)
      );

      nodes = nodes.filter((n) => {
        if (n.type === 'file') {
          return n.data.diffStatus && diffStatusFilters.has(n.data.diffStatus);
        }
        if (n.type === 'folder' || n.type === 'repo') {
          const folderPath = n.data.path;
          if (!folderPath) return true; // root repository node
          for (const filePath of matchingFilePaths) {
            if (filePath && (filePath === folderPath || filePath.startsWith(folderPath + '/'))) {
              return true;
            }
          }
          return false;
        }
        return true;
      });
    }

    // Apply search query filter
    if (q) {
      nodes = nodes.filter((n) => {
        const label = n.data.label ? String(n.data.label).toLowerCase() : '';
        const path = n.data.path ? String(n.data.path).toLowerCase() : '';
        return label.includes(q) || path.includes(q);
      });
    }

    // Apply Focus Layer filters dynamically
    if (activeFocusLayer && activeFocusLayer !== 'all') {
      nodes = nodes.filter((n) => {
        if (n.type === 'repo') return true;
        const path = n.data.path ? String(n.data.path).toLowerCase() : '';
        const ext = n.data.extension ? String(n.data.extension).toLowerCase() : '';

        if (activeFocusLayer === 'api') {
          return path.includes('api') || path.includes('server') || path.includes('route') || path.includes('controller') || path.includes('endpoints');
        }
        if (activeFocusLayer === 'ui') {
          return path.includes('component') || path.includes('page') || path.includes('style') || path.includes('view') || ['tsx', 'jsx', 'css'].includes(ext);
        }
        if (activeFocusLayer === 'core') {
          return path.includes('service') || path.includes('util') || path.includes('helper') || path.includes('lib') || path.includes('core') || ['rs', 'go', 'py', 'ts', 'js'].includes(ext);
        }
        if (activeFocusLayer === 'config') {
          return ext === 'json' || ext === 'yaml' || ext === 'yml' || ext === 'toml' || path.includes('config') || path.includes('webpack') || path.includes('vite');
        }
        return true;
      });
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = graph.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

    return { nodes, edges };
  }, [graph, searchQuery, nodeTypeFilters, diffStatusFilters, readOnly, activeFocusLayer]);

  const layouted = useMemo(() => {
    return getLayoutedElements(filtered.nodes as Node[], filtered.edges as Edge[], layoutType);
  }, [filtered, layoutType]);

  const connectedNodeIdsByNodeId = useMemo(() => {
    const lookup = new Map<string, Set<string>>();

    for (const edge of filtered.edges) {
      if (!lookup.has(edge.source)) lookup.set(edge.source, new Set([edge.source]));
      if (!lookup.has(edge.target)) lookup.set(edge.target, new Set([edge.target]));
      lookup.get(edge.source)?.add(edge.target);
      lookup.get(edge.target)?.add(edge.source);
      lookup.get(edge.source)?.add(edge.source);
      lookup.get(edge.target)?.add(edge.target);
    }

    return lookup;
  }, [filtered.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const rawNodes = layouted.nodes;
    const rawEdges = layouted.edges;
    const nodeById = new Map(rawNodes.map((node) => [node.id, node]));

    const nodesWithClasses = rawNodes.map((n) => ({
      ...n,
      className: getNodeClassName(n, selectedNodeId, highlightedNodeIds),
    }));

    const edgesWithStyles = rawEdges.map((e) => {
      const isSelectedNodeConnected = selectedNodeId && (e.source === selectedNodeId || e.target === selectedNodeId);
      return {
        ...e,
        type: layoutType === 'force' ? 'default' : 'smoothstep',
        style: getEdgeStyle(e, selectedNodeId, highlightedNodeIds, nodeById, theme),
        animated: !!isSelectedNodeConnected,
      };
    });

    setNodes(nodesWithClasses as Node[]);
    setEdges(edgesWithStyles as Edge[]);
  }, [layouted, selectedNodeId, highlightedNodeIds, layoutType, theme, setNodes, setEdges]);

  useEffect(() => {
    // Only fit view initially if no node is selected/focused
    if (selectedNodeId || focusedFilePath) return;
    const timer = setTimeout(() => {
      fitView({ duration: 400, padding: 0.35 });
    }, 100);
    return () => clearTimeout(timer);
  }, [layoutType, fitView, graph, selectedNodeId, focusedFilePath]);

  const lastCenteredIdRef = useRef<string | null>(null);

  // Center and zoom in on selected node or focused file path
  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    const activeId = selectedNodeId || (focusedFilePath ? `file:${focusedFilePath}` : null);
    if (!activeId) {
      lastCenteredIdRef.current = null;
      return;
    }

    if (lastCenteredIdRef.current === activeId) return;

    const targetNode = nodes.find(
      (n) => n.id === activeId || (n.data?.path && n.data.path === focusedFilePath)
    );

    if (targetNode) {
      lastCenteredIdRef.current = activeId;
      const x = targetNode.position.x + (targetNode.measured?.width ?? targetNode.width ?? 120) / 2;
      const y = targetNode.position.y + (targetNode.measured?.height ?? targetNode.height ?? 36) / 2;

      const timer = setTimeout(() => {
        setCenter(x, y, { zoom: 1.3, duration: 600 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedNodeId, focusedFilePath, nodes, setCenter]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (readOnly) return;
      lastCenteredIdRef.current = null; // Force centering on explicit click
      setSelectedNodeId(node.id);

      if (node.type === 'file' && node.data?.path) {
        setFocusedFilePath(node.data.path as string);
        setInspectorOpen(true);
      }

      setHighlightedNodeIds(new Set(connectedNodeIdsByNodeId.get(node.id) ?? [node.id]));
    },
    [readOnly, connectedNodeIdsByNodeId, setSelectedNodeId, setHighlightedNodeIds, setFocusedFilePath, setInspectorOpen],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setHighlightedNodeIds(new Set());
  }, [setSelectedNodeId, setHighlightedNodeIds]);

  const { owner = '', repo = '' } = useParams();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf' | null>(null);

  const handleExport = useCallback(async (format: 'png' | 'pdf') => {
    const el = document.querySelector('.react-flow') as HTMLElement;
    if (!el) return;

    setIsExporting(true);
    setExportFormat(format);

    // Save current viewport
    const zoom = reactFlowInstance.getZoom();
    const { x, y } = reactFlowInstance.getViewport();

    // Fit view to capture all nodes nicely
    reactFlowInstance.fitView({ padding: 0.1 });

    // Wait a brief moment for the fitView layout transition to complete
    await new Promise((resolve) => setTimeout(resolve, 250));

    try {
      const isDark = theme === 'dark';
      const dataUrl = await toPng(el, {
        backgroundColor: isDark ? '#0f1015' : '#f9fafb',
        quality: 0.98,
        pixelRatio: 2, // 2x scale for crisp nodes and text
        filter: (node: HTMLElement) => {
          if (
            node.classList && (
              node.classList.contains('react-flow__controls') ||
              node.classList.contains('react-flow__panel') ||
              node.classList.contains('react-flow__attribution') ||
              node.classList.contains('graph-controls') ||
              node.classList.contains('export-panel') ||
              node.classList.contains('graph-legend')
            )
          ) {
            return false;
          }
          return true;
        },
      });

      if (format === 'png') {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${owner}_${repo}_dependency_map.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // PDF Export
        const rect = el.getBoundingClientRect();
        const elWidth = rect.width;
        const elHeight = rect.height;

        const pdf = new jsPDF({
          orientation: elWidth > elHeight ? 'landscape' : 'portrait',
          unit: 'px',
          format: [elWidth, elHeight],
        });

        pdf.addImage(dataUrl, 'PNG', 0, 0, elWidth, elHeight);
        pdf.save(`${owner}_${repo}_dependency_map.pdf`);
      }
    } catch (err) {
      console.error('Failed to export graph:', err);
    } finally {
      // Revert viewport back to user's perspective
      reactFlowInstance.setViewport({ x, y, zoom }, { duration: 150 });
      setIsExporting(false);
      setExportFormat(null);
    }
  }, [reactFlowInstance, theme, owner, repo]);

  const isLoading = !graph || !graph.nodes || graph.nodes.length === 0;

  return (
    <div className="graph-canvas-host h-full w-full relative">
      {isLoading && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm select-none">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <span className="mt-3 text-xs text-zinc-400 font-medium">Laying out dependency graph...</span>
        </div>
      )}
      {isExporting && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md select-none">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <span className="mt-3 text-xs text-zinc-400 font-medium font-mono">
            Generating high-res {exportFormat?.toUpperCase()}...
          </span>
        </div>
      )}
      <ReactFlow
        className="canvas-flow-bg"
        colorMode={theme}
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.35, maxZoom: 1.1 }}
        minZoom={0.05}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={!readOnly}
        nodesConnectable={false}
        onlyRenderVisibleElements
        panOnDrag
        panOnScroll={false}
        zoomOnScroll
        zoomOnPinch
        selectionOnDrag={false}
        style={flowStyle}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color={isDark ? 'rgba(255, 255, 255, 0.085)' : 'rgba(0, 0, 0, 0.08)'}
        />
        {!readOnly && (
          <>
            <Panel
              position="top-left"
              className="ml-3 mt-3 flex items-center gap-2 rounded-xl border border-white/5 bg-zinc-950/80 p-2 text-xs text-zinc-300 shadow-2xl backdrop-blur-md export-panel select-none"
            >
              <div className="flex items-center gap-1.5 px-2 border-r border-white/5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Export Map
              </div>
              <button
                type="button"
                onClick={() => handleExport('png')}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all active:scale-[0.98]"
                title="Export graph as PNG"
              >
                <Download className="h-3 w-3 text-zinc-400" />
                <span>PNG</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all active:scale-[0.98]"
                title="Export graph as PDF"
              >
                <Download className="h-3 w-3 text-zinc-400" />
                <span>PDF</span>
              </button>
            </Panel>
            <Controls
              showInteractive={false}
              className="graph-controls !shadow-none"
            />
            <Panel
              position="top-right"
              className="mr-3 mt-3 flex flex-col gap-2.5 rounded-xl border border-white/5 bg-zinc-950/80 p-3.5 text-xs text-zinc-300 shadow-2xl backdrop-blur-md max-w-[220px]"
            >
              <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                Canvas Legend
              </div>

              {/* Node Types Section */}
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-0.5 select-none">Node Types</span>
                <button
                  type="button"
                  onClick={() => toggleNodeTypeFilter('repo')}
                  title="Toggle Repository Root filter"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-all hover:bg-white/5 active:scale-[0.98]",
                    !nodeTypeFilters.has('repo') && "opacity-40 line-through decoration-zinc-500"
                  )}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-violet-500/10 border border-violet-500/20 text-violet-400 shrink-0">
                    <FolderGit2 className="h-3 w-3" />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-300">Repository Root</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleNodeTypeFilter('folder')}
                  title="Toggle Directories filter"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-all hover:bg-white/5 active:scale-[0.98]",
                    !nodeTypeFilters.has('folder') && "opacity-40 line-through decoration-zinc-500"
                  )}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                    <Folder className="h-3 w-3 fill-amber-400/10" />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-300">Directory</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleNodeTypeFilter('file')}
                  title="Toggle Code Files filter"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-all hover:bg-white/5 active:scale-[0.98]",
                    !nodeTypeFilters.has('file') && "opacity-40 line-through decoration-zinc-500"
                  )}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                    <FileCode className="h-3 w-3" />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-300">Code / Assets</span>
                </button>
              </div>

              {/* Diff status section */}
              {compareBranch && (
                <div className="space-y-1 pt-1.5 border-t border-white/5">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-0.5 select-none">Change Status</span>
                  <button
                    type="button"
                    onClick={() => toggleDiffStatusFilter('added')}
                    title="Filter by Added Files"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-all hover:bg-white/5 active:scale-[0.98]",
                      diffStatusFilters.size > 0 && !diffStatusFilters.has('added') && "opacity-40"
                    )}
                  >
                    <span className="flex h-4 w-4 items-center justify-center text-xs font-bold text-emerald-500 select-none bg-emerald-500/10 border border-emerald-500/20 rounded font-mono shrink-0">+</span>
                    <span className="text-[11px] font-medium text-zinc-300">Added File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDiffStatusFilter('modified')}
                    title="Filter by Modified Files"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-all hover:bg-white/5 active:scale-[0.98]",
                      diffStatusFilters.size > 0 && !diffStatusFilters.has('modified') && "opacity-40"
                    )}
                  >
                    <span className="flex h-4 w-4 items-center justify-center text-xs font-bold text-amber-500 select-none bg-amber-500/10 border border-amber-500/20 rounded font-mono shrink-0">~</span>
                    <span className="text-[11px] font-medium text-zinc-300">Modified File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDiffStatusFilter('deleted')}
                    title="Filter by Deleted Files"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-all hover:bg-white/5 active:scale-[0.98]",
                      diffStatusFilters.size > 0 && !diffStatusFilters.has('deleted') && "opacity-40"
                    )}
                  >
                    <span className="flex h-4 w-4 items-center justify-center text-xs font-bold text-red-500 select-none bg-red-500/10 border border-red-500/20 rounded font-mono shrink-0">-</span>
                    <span className="text-[11px] font-medium text-zinc-300">Deleted File</span>
                  </button>
                </div>
              )}
            </Panel>
          </>
        )}
      </ReactFlow>
    </div>
  );
}

function getNodeClassName(
  node: GraphNode | Node,
  selectedId: string | null,
  highlighted: Set<string>,
): string {
  if (!selectedId) return '';
  if (node.id === selectedId) return 'selected';
  if (highlighted.has(node.id)) return '';
  return 'dimmed';
}

function getEdgeStyle(
  edge: { source: string; target: string },
  selectedId: string | null,
  highlighted: Set<string>,
  nodes: Map<string, Node>,
  theme: 'dark' | 'light',
): React.CSSProperties {
  const targetNode = nodes.get(edge.target);
  const sourceNode = nodes.get(edge.source);

  const isTargetDeleted = targetNode?.data?.diffStatus === 'deleted';
  const isSourceDeleted = sourceNode?.data?.diffStatus === 'deleted';
  const isDeleted = isTargetDeleted || isSourceDeleted;

  if (isDeleted) {
    return {
      stroke: theme === 'dark' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.25)',
      strokeWidth: 1.2,
      strokeDasharray: '3,3',
    };
  }

  const defaultStyle = {
    stroke: theme === 'dark' ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.15)',
    strokeWidth: theme === 'dark' ? 1.35 : 1.2,
    transition: 'stroke 0.2s, stroke-width 0.2s',
  };

  if (!selectedId) {
    const isAdded = targetNode?.data?.diffStatus === 'added' || sourceNode?.data?.diffStatus === 'added';
    const isModified = targetNode?.data?.diffStatus === 'modified' || sourceNode?.data?.diffStatus === 'modified';

    if (isAdded) {
      return {
        stroke: theme === 'dark' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.25)',
        strokeWidth: 1.35,
      };
    }
    if (isModified) {
      return {
        stroke: theme === 'dark' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.25)',
        strokeWidth: 1.35,
      };
    }
    return defaultStyle;
  }

  const isConnected = edge.source === selectedId || edge.target === selectedId;

  if (isConnected) {
    const color = (targetNode?.data?.nodeColor as string) ?? '#fbbf24';
    return {
      stroke: color,
      strokeWidth: 2,
      opacity: 1,
      transition: 'stroke 0.2s, stroke-width 0.2s',
    };
  }

  const inHighlight = highlighted.has(edge.source) && highlighted.has(edge.target);
  if (inHighlight) {
    return {
      stroke: theme === 'dark' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)',
      strokeWidth: theme === 'dark' ? 1.45 : 1.2,
      opacity: 0.8,
      transition: 'stroke 0.2s, stroke-width 0.2s',
    };
  }

  return {
    stroke: theme === 'dark' ? 'rgba(255, 255, 255, 0.11)' : 'rgba(0, 0, 0, 0.05)',
    strokeWidth: 1,
    opacity: 0.15,
    transition: 'stroke 0.2s, stroke-width 0.2s',
  };
}
