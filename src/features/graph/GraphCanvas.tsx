import { useCallback, useEffect, useMemo, type CSSProperties } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useEdgesState,
  useNodesState,
  getConnectedEdges,
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
    setFocusedFilePath,
    setInspectorOpen,
    layoutType,
    theme,
  } = useVizStore();

  const { fitView } = useReactFlow();
  const isDark = theme === 'dark';

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

    const nodes = graph.nodes.filter((n) => {
      if (!activeFilters.has(n.type)) return false;
      if (!q) return true;
      const label = n.data.label ? String(n.data.label).toLowerCase() : '';
      const path = n.data.path ? String(n.data.path).toLowerCase() : '';
      return label.includes(q) || path.includes(q);
    });

    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = graph.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

    return { nodes, edges };
  }, [graph, searchQuery, nodeTypeFilters, readOnly]);

  const layouted = useMemo(() => {
    return getLayoutedElements(filtered.nodes as Node[], filtered.edges as Edge[], layoutType);
  }, [filtered, layoutType]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const rawNodes = layouted.nodes;
    const rawEdges = layouted.edges;

    const nodesWithClasses = rawNodes.map((n) => ({
      ...n,
      className: getNodeClassName(n as any, selectedNodeId, highlightedNodeIds),
    }));

    const edgesWithStyles = rawEdges.map((e) => {
      const isSelectedNodeConnected = selectedNodeId && (e.source === selectedNodeId || e.target === selectedNodeId);
      return {
        ...e,
        type: layoutType === 'force' ? 'default' : 'smoothstep',
        style: getEdgeStyle(e, selectedNodeId, highlightedNodeIds, rawNodes as Node[], theme),
        animated: !!isSelectedNodeConnected,
      };
    });

    setNodes(nodesWithClasses as Node[]);
    setEdges(edgesWithStyles as Edge[]);
  }, [layouted, selectedNodeId, highlightedNodeIds, layoutType, theme, setNodes, setEdges]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ duration: 400, padding: 0.35 });
    }, 100);
    return () => clearTimeout(timer);
  }, [layoutType, fitView, graph]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (readOnly) return;
      setSelectedNodeId(node.id);

      if (node.type === 'file' && node.data?.path) {
        setFocusedFilePath(node.data.path as string);
        setInspectorOpen(true);
      }

      const connected = getConnectedEdges([node], filtered.edges as Edge[]);
      const ids = new Set<string>([node.id]);
      connected.forEach((e) => {
        ids.add(e.source);
        ids.add(e.target);
      });
      setHighlightedNodeIds(ids);
    },
    [readOnly, filtered.edges, setSelectedNodeId, setHighlightedNodeIds, setFocusedFilePath, setInspectorOpen],
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
            <MiniMap
              position="top-right"
              className="graph-minimap !rounded-md !shadow-none"
              style={{
                width: 100,
                height: 64,
                backgroundColor: isDark ? 'rgba(9, 9, 11, 0.88)' : 'rgba(255, 255, 255, 0.88)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(39, 39, 42, 0.16)'}`,
              }}
              pannable
              zoomable
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
          </>
        )}
      </ReactFlow>
    </div>
  );
}

function getNodeClassName(
  node: GraphNode,
  selectedId: string | null,
  highlighted: Set<string>,
): string {
  if (!selectedId) return '';
  if (node.id === selectedId) return '';
  if (highlighted.has(node.id)) return '';
  return 'dimmed';
}

function getEdgeStyle(
  edge: { source: string; target: string },
  selectedId: string | null,
  highlighted: Set<string>,
  nodes: Node[],
  theme: 'dark' | 'light',
): React.CSSProperties {
  const defaultStyle = {
    stroke: theme === 'dark' ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.15)',
    strokeWidth: theme === 'dark' ? 1.35 : 1.2,
    transition: 'stroke 0.2s, stroke-width 0.2s',
  };

  if (!selectedId) {
    return defaultStyle;
  }

  const isConnected = edge.source === selectedId || edge.target === selectedId;

  if (isConnected) {
    const targetNode = nodes.find((n) => n.id === edge.target);
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
