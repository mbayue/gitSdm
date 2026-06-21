import type {
  Contributor,
  Dependency,
  GraphData,
  GraphEdge,
  GraphNode,
  TreeNode,
} from '../../src/types';
import { applyDagreLayout } from './layout';
import { getNodeCircleColor, getNodeCircleSize } from './node-colors';
import { buildImportEdges } from '../parser/import-resolver';

const MAX_FOLDER_NODES = 200;
const MAX_FILE_NODES = 800;

export interface GraphBuildInput {
  owner: string;
  repo: string;
  tree: TreeNode[];
  dependencies: Dependency[];
  contributors: Contributor[];
  fileContents?: Record<string, string>;
}

function countDescendants(node: TreeNode): number {
  if (node.type === 'file') return 1;
  return (node.children ?? []).reduce((sum, c) => sum + countDescendants(c), 0);
}

function enrichNodeData(
  type: 'repo' | 'folder' | 'file',
  label: string,
  path?: string,
  extension?: string,
  childCount?: number,
): GraphNode['data'] {
  const displayLabel =
    type === 'folder' && childCount !== undefined ? `${label} (${childCount})` : label;
  return {
    label: displayLabel,
    path,
    extension,
    childCount,
    nodeColor: getNodeCircleColor(type, label, extension, path),
    circleSize: getNodeCircleSize(type),
  };
}

export function buildGraph(input: GraphBuildInput): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const repoId = `repo:${input.owner}/${input.repo}`;
  nodes.push({
    id: repoId,
    type: 'repo',
    position: { x: 0, y: 0 },
    data: enrichNodeData('repo', input.repo),
  });

  let folderCount = 0;
  let fileCount = 0;

  function walkTree(treeNodes: TreeNode[], parentId: string, depth: number): void {
    for (const node of treeNodes) {
      if (node.type === 'dir') {
        if (folderCount >= MAX_FOLDER_NODES) continue;
        folderCount++;
        const id = `folder:${node.path}`;
        const childCount = countDescendants(node);
        nodes.push({
          id,
          type: 'folder',
          position: { x: 0, y: 0 },
          data: enrichNodeData('folder', node.name, node.path, undefined, childCount),
        });
        edges.push({
          id: `e:${parentId}->${id}`,
          source: parentId,
          target: id,
          type: 'contains',
        });
        if (node.children && depth < 6) {
          walkTree(node.children, id, depth + 1);
        }
      } else {
        if (fileCount >= MAX_FILE_NODES) continue;
        fileCount++;
        const id = `file:${node.path}`;
        const ext = node.name.includes('.') ? node.name.split('.').pop() : undefined;
        nodes.push({
          id,
          type: 'file',
          position: { x: 0, y: 0 },
          data: {
            ...enrichNodeData('file', node.name, node.path, ext),
            fileClass: node.fileClass,
            size: node.size,
          },
        });
        edges.push({
          id: `e:${parentId}->${id}`,
          source: parentId,
          target: id,
          type: 'contains',
        });
      }
    }
  }

  walkTree(input.tree, repoId, 0);

  // Extract all file paths from registered file nodes
  const fileNodes = nodes.filter((n) => n.type === 'file');
  const allFilePaths = fileNodes.map((n) => n.id.replace(/^file:/, ''));

  if (input.fileContents) {
    const importEdges = buildImportEdges(input.fileContents, allFilePaths);
    edges.push(...importEdges);
  }

  const laidOut = applyDagreLayout(nodes, edges);
  return { nodes: laidOut, edges, layout: 'dagre' };
}
