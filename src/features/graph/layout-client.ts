import dagre from 'dagre';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import type { Node, Edge } from '@xyflow/react';

type LayoutNode = Node & SimulationNodeDatum;

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  layoutType: 'TB' | 'LR' | 'force',
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };
  const nodeIds = new Set(nodes.map((node) => node.id));

  if (layoutType === 'force') {
    // Deterministic position seeding based on ID hash to ensure stable layout
    const getSeedPosition = (id: string) => {
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
      }
      const x = (hash % 400) + 200; // range 200 to 600
      const y = ((Math.abs(hash) >> 8) % 400) + 200;
      return { x, y };
    };

    // Clone nodes and seed them deterministically
    const simNodes: LayoutNode[] = nodes.map((n) => {
      const seed = getSeedPosition(n.id);
      return {
        ...n,
        x: seed.x,
        y: seed.y,
      };
    });

    // Filter edges to only include ones where both source and target exist
    const simLinks: SimulationLinkDatum<LayoutNode>[] = edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => ({
        source: e.source,
        target: e.target,
      }));

    // Create force simulation
    const simulation = forceSimulation(simNodes)
      .force(
        'link',
        forceLink(simLinks)
          .id((d) => (d as LayoutNode).id)
          .distance(70)
      )
      .force('charge', forceManyBody().strength(-150))
      .force('collide', forceCollide().radius(45))
      .force('x', forceX(400).strength(0.08))
      .force('y', forceY(400).strength(0.08))
      .stop();

    // Run simulation synchronously to pre-calculate positions
    for (let i = 0; i < 150; i++) {
      simulation.tick();
    }

    return {
      nodes: simNodes.map((n) => ({
        ...n,
        position: { x: n.x ?? 0, y: n.y ?? 0 },
      })) as Node[],
      edges,
    };
  }

  // Dagre hierarchical layout
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  g.setGraph({
    rankdir: layoutType,
    nodesep: 40,
    ranksep: 75,
  });

  nodes.forEach((node) => {
    const label = (node.data?.label as string) ?? '';
    // Estimate node size dynamically based on text label size
    const width = Math.max(140, label.length * 6.5 + 50);
    const height = 40;
    g.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    const label = (node.data?.label as string) ?? '';
    const width = Math.max(140, label.length * 6.5 + 50);
    const height = 40;

    if (!pos) return node;

    return {
      ...node,
      position: {
        x: pos.x - width / 2,
        y: pos.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
