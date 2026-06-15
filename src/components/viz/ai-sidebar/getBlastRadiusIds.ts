import type { RepoAnalysis } from '@/types';

export const getBlastRadiusIds = (nodeId: string, analysis: RepoAnalysis) => {
  const visited = new Set<string>([nodeId]);
  const queue: string[] = [];

  const targetNode = analysis.graph.nodes.find(n => n.id === nodeId);
  if (!targetNode) return visited;

  if (targetNode.type === 'file') {
    queue.push(nodeId);
  } else if (targetNode.type === 'folder' && targetNode.data.path) {
    const folderPath = targetNode.data.path;
    for (const n of analysis.graph.nodes) {
      if (n.type === 'file' && n.data.path?.startsWith(folderPath + '/')) {
        visited.add(n.id);
        queue.push(n.id);
      }
    }
  }

  const edgesByTarget = new Map<string, string[]>();
  for (const edge of analysis.graph.edges) {
    if (edge.type === 'imports') {
      if (!edgesByTarget.has(edge.target)) {
        edgesByTarget.set(edge.target, []);
      }
      edgesByTarget.get(edge.target)!.push(edge.source);
    }
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const sources = edgesByTarget.get(curr);
    if (sources) {
      for (const source of sources) {
        if (!visited.has(source)) {
          visited.add(source);
          queue.push(source);
        }
      }
    }
  }
  return visited;
};
