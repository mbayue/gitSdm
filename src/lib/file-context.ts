import type { GraphData, GraphNode } from '@/types';

export function getFileContext(graph: GraphData, path: string) {
  const node = graph.nodes.find((item) => item.type === 'file' && item.data.path === path);
  const dependencies = new Set<string>();
  const dependents = new Set<string>();
  if (node) {
    for (const edge of graph.edges) {
      if (edge.type === 'contains' || edge.source === edge.target) continue;
      if (edge.source === node.id) dependencies.add(edge.target);
      if (edge.target === node.id) dependents.add(edge.source);
    }
  }
  const byId = new Map(graph.nodes.map((item) => [item.id, item]));
  const resolve = (ids: Set<string>): GraphNode[] => Array.from(ids)
    .map((id) => byId.get(id)).filter((item): item is GraphNode => !!item);
  const roles = {
    entry: 'Entry point', config: 'Configuration', test: 'Tests', source: 'Source code',
    doc: 'Documentation', asset: 'Asset', other: 'Supporting file',
  };
  return {
    node,
    role: node?.data.fileClass ? roles[node.data.fileClass] : 'File',
    dependencies: resolve(dependencies),
    dependents: resolve(dependents),
  };
}
