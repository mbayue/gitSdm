import dagre from 'dagre';
import type { GraphEdge, GraphNode } from '../../src/types';

function estimateSize(node: GraphNode): { width: number; height: number } {
  const labelLen = node.data.label?.length ?? 8;
  const circle = (node.data.circleSize as number) ?? 10;
  const width = Math.max(90, circle + labelLen * 6.5 + 16);
  const height = Math.max(28, circle + 12);
  return { width, height };
}

export function applyDagreLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  direction: 'TB' | 'LR' = 'TB',
): GraphNode[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 28,
    ranksep: 52,
    marginx: 40,
    marginy: 40,
  });

  for (const node of nodes) {
    g.setNode(node.id, estimateSize(node));
  }

  for (const edge of edges) {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    const size = estimateSize(node);
    if (!pos) return node;
    return {
      ...node,
      position: {
        x: pos.x - size.width / 2,
        y: pos.y - size.height / 2,
      },
    };
  });
}
