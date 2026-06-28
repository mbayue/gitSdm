import type { RepoAnalysis } from '@/types';

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function sanitizeMermaidId(nodeId: string): string {
  const sanitized = nodeId.replace(/[^a-zA-Z0-9]/g, '_');
  const hash = hashString(nodeId);
  return `${sanitized}_${hash}`;
}

function getNodeLabel(node: RepoAnalysis['graph']['nodes'][number]): string {
  const label = node.data?.label?.trim();
  if (label) return label;

  const path = node.data?.path?.trim();
  if (path) return path.split('/').pop() || path;

  return node.id;
}

export function generateProgrammaticMermaid(analysis: RepoAnalysis): string {
  const nodes = analysis.graph?.nodes?.filter((n) => n.type === 'file') || [];
  const edges = analysis.graph?.edges || [];

  const fileConnectivity = new Map<string, { incoming: number; outgoing: number }>();

  nodes.forEach((n) => {
    fileConnectivity.set(n.id, { incoming: 0, outgoing: 0 });
  });

  edges.forEach((e) => {
    const source = fileConnectivity.get(e.source);
    const target = fileConnectivity.get(e.target);
    if (source) source.outgoing++;
    if (target) target.incoming++;
  });

  const scoredNodes = nodes.map((n) => {
    const conn = fileConnectivity.get(n.id) || { incoming: 0, outgoing: 0 };
    const degree = conn.incoming + conn.outgoing;
    let score = degree;
    if (n.data?.fileClass === 'entry') score += 10;
    if (analysis.importantFiles?.includes(n.data?.path || '')) score += 5;
    return { node: n, score };
  });

  scoredNodes.sort((a, b) => b.score - a.score);
  const topScored = scoredNodes.slice(0, 25);
  const keptNodeIds = new Set(topScored.map((sn) => sn.node.id));
  const keptNodes = topScored.map((sn) => sn.node);

  const foldersMap = new Map<string, typeof keptNodes>();
  keptNodes.forEach((node) => {
    const path = node.data?.path || '';
    const parts = path.split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
    if (!foldersMap.has(folder)) {
      foldersMap.set(folder, []);
    }
    foldersMap.get(folder)!.push(node);
  });

  const lines: string[] = ['graph LR'];

  let folderIdCounter = 0;
  foldersMap.forEach((files, folderPath) => {
    const folderId = `dir_${folderIdCounter++}`;
    const escapedFolderPath = folderPath.replace(/"/g, '#quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    lines.push(`  subgraph ${folderId} ["${escapedFolderPath}"]`);
    files.forEach((node) => {
      const label = getNodeLabel(node).replace(/"/g, '#quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const mermaidId = sanitizeMermaidId(node.id);
      lines.push(`    ${mermaidId}["${label}"]`);
    });
    lines.push('  end');
  });

  const addedEdges = new Set<string>();
  edges.forEach((edge) => {
    const srcId = edge.source;
    const tgtId = edge.target;
    if (keptNodeIds.has(srcId) && keptNodeIds.has(tgtId)) {
      const srcMermaidId = sanitizeMermaidId(srcId);
      const tgtMermaidId = sanitizeMermaidId(tgtId);
      const edgeKey = `${srcMermaidId}-->${tgtMermaidId}`;
      if (!addedEdges.has(edgeKey)) {
        lines.push(`  ${srcMermaidId} --> ${tgtMermaidId}`);
        addedEdges.add(edgeKey);
      }
    }
  });

  keptNodes.forEach((node) => {
    const mermaidId = sanitizeMermaidId(node.id);
    let cls = 'service';
    if (node.data?.fileClass === 'entry') cls = 'entry';
    else if (node.data?.fileClass === 'config') cls = 'config';
    else if (node.data?.fileClass === 'test') cls = 'test';
    lines.push(`  class ${mermaidId} ${cls}`);
  });

  return lines.join('\n');
}
