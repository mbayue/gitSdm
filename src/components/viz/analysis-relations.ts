import type { GraphData, GraphEdge } from "@/types";
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

