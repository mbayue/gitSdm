import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Node,
  type Edge,
  type DefaultEdgeOptions,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes';
import type { GraphData, GraphNode } from '@/types';
import { useVizStore } from '@/stores/viz-store';
import { getNodeCircleColor } from './node-colors';
import { getLayoutedElements } from './layout-client';

interface GraphCanvasProps {
  graph: GraphData;
  readOnly?: boolean;
}

export function GraphCanvas({ graph, readOnly }: GraphCanvasProps) {
  const {
    searchQuery,
    nodeTypeFilters,
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
  } = useVizStore();

  const { fitView, setCenter } = useReactFlow();
  const isDark = theme === 'dark';
  const showMiniMap = !readOnly && graph.nodes.length <= 350;

  const flowStyle = useMemo(() => ({
    background: isDark
      ? 'radial-gradient(circle at 50% 28%, rgba(139, 92, 246, 0.10) 0%, rgba(139, 92, 246, 0.035) 26%, transparent 58%), radial-gradient(circle at 100% 0%, rgba(34, 211, 238, 0.08) 0%, transparent 42%), #050508'
      : 'radial-gradient(circle at 50% 28%, rgba(139, 92, 246, 0.045) 0%, transparent 58%), radial-gradient(circle at 100% 0%, rgba(34, 211, 238, 0.035) 0%, transparent 42%), #f9fafb',
    '--xy-background-color': isDark ? '#050508' : '#f9fafb',
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

    let nodes = graph.nodes.filter((n) => {
      if (!activeFilters.has(n.type)) return false;
      if (!q) return true;
      const label = n.data.label ? String(n.data.label).toLowerCase() : '';
      const path = n.data.path ? String(n.data.path).toLowerCase() : '';
      return label.includes(q) || path.includes(q);
    });

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
  }, [graph, searchQuery, nodeTypeFilters, readOnly, activeFocusLayer]);

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

  return (
    <div className="graph-canvas-host h-full w-full">
      <ReactFlow
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
            <Controls
              showInteractive={false}
              className="graph-controls !shadow-none"
            />
            {showMiniMap && (
              <MiniMap
                position="top-right"
                className="graph-minimap !rounded-md !shadow-none"
                style={{
                  width: 100,
                  height: 64,
                  backgroundColor: isDark ? 'rgba(9, 9, 11, 0.88)' : 'rgba(255, 255, 255, 0.88)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(39, 39, 42, 0.16)'}`,
                }}
                bgColor={isDark ? '#111113' : '#ffffff'}
                nodeColor={(n) => {
                  const d = n.data as { nodeColor?: string; extension?: string; label?: string };
                  if (d.nodeColor) return d.nodeColor;
                  const ext = d.extension ?? '';
                  const name = (d.label as string) ?? '';
                  if (n.type === 'folder') return getNodeCircleColor('folder', name, ext);
                  if (n.type === 'file') return getNodeCircleColor('file', name, ext);
                  return '#ffffff';
                }}
                maskColor={isDark ? 'rgba(0, 0, 0, 0.82)' : 'rgba(255, 255, 255, 0.72)'}
              />
            )}
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
