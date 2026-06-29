import type {
	  Contributor,
	  Dependency,
	  GraphData,
	  GraphEdge,
	  GraphNode,
	  ScopedDependency,
	  TreeNode,
	  WorkspacePackage,
	} from '../../src/types';
	import { applyDagreLayout } from './layout';
	import { getNodeCircleColor, getNodeCircleSize } from './node-colors';
	import { buildImportEdges } from '../parser/import-resolver';
	import { findWorkspacePackageForPath } from '../parser/dependency-analyzer';

const MAX_FOLDER_NODES = 300;
const MAX_FILE_NODES = 1200;

export interface GraphBuildInput {
  owner: string;
  repo: string;
  tree: TreeNode[];
	  dependencies: Dependency[];
	  contributors: Contributor[];
	  fileContents?: Record<string, string>;
	  workspacePackages?: readonly WorkspacePackage[];
	  scopedDependencies?: readonly ScopedDependency[];
	  limits?: {
	    readonly maxFolders?: number;
	    readonly maxFiles?: number;
	  };
	}

function countDescendants(node: TreeNode): number {
  if (node.type === 'file') return 1;
  return (node.children ?? []).reduce((sum, c) => sum + countDescendants(c), 0);
}

	function enrichNodeData(
	  type: 'repo' | 'folder' | 'file' | 'package',
	  label: string,
	  path?: string,
	  extension?: string,
	  childCount?: number,
	  ecosystem?: string,
	): GraphNode['data'] {
  const displayLabel =
    type === 'folder' && childCount !== undefined ? `${label} (${childCount})` : label;
  return {
    label: displayLabel,
    path,
	    extension,
	    ecosystem,
	    childCount,
	    nodeColor: getNodeCircleColor(type, label, extension, path),
	    circleSize: getNodeCircleSize(type),
	  };
	}

	function packageNodeId(pkg: WorkspacePackage): string {
	  return `package:${pkg.rootPath || '.'}`;
	}

	function packageLabel(pkg: WorkspacePackage, repo: string): string {
	  if (pkg.name) return pkg.name;
	  if (pkg.rootPath === '') return repo;
	  return pkg.rootPath.split('/').pop() ?? pkg.rootPath;
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
	const maxFolders = input.limits?.maxFolders ?? MAX_FOLDER_NODES;
	const maxFiles = input.limits?.maxFiles ?? MAX_FILE_NODES;

  function walkTree(treeNodes: TreeNode[], parentId: string, depth: number): void {
    for (const node of treeNodes) {
      if (node.type === 'dir') {
        if (folderCount >= maxFolders) {
          if (node.children && depth < 6) {
            walkTree(node.children, parentId, depth + 1);
          }
          continue;
        }
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
        if (fileCount >= maxFiles) continue;
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

  const workspacePackages = input.workspacePackages ?? [];
  const packageByName = new Map(workspacePackages.flatMap((pkg) => (pkg.name ? [[pkg.name, pkg]] : [])));
  const packageByManifest = new Map(workspacePackages.map((pkg) => [pkg.manifestPath, pkg]));

  for (const pkg of workspacePackages) {
    nodes.push({
      id: packageNodeId(pkg),
      type: 'package',
      position: { x: 0, y: 0 },
      data: enrichNodeData('package', packageLabel(pkg, input.repo), pkg.rootPath || '.', undefined, undefined, pkg.ecosystem),
    });
  }

  // Extract all file paths from registered file nodes
  const fileNodes = nodes.filter((n) => n.type === 'file');
  const allFilePaths = fileNodes.map((n) => n.id.replace(/^file:/, ''));

  for (const path of allFilePaths) {
    const ownerPackage = findWorkspacePackageForPath(path, workspacePackages);
    if (!ownerPackage) continue;
    edges.push({
      id: `e:${packageNodeId(ownerPackage)}->file:${path}`,
      source: packageNodeId(ownerPackage),
      target: `file:${path}`,
      type: 'contains',
    });
  }

  for (const dep of input.scopedDependencies ?? []) {
    const sourcePackage = packageByManifest.get(dep.manifestPath);
    const targetPackage = packageByName.get(dep.name);
    if (!sourcePackage || !targetPackage || sourcePackage.rootPath === targetPackage.rootPath) continue;
    edges.push({
      id: `e:${packageNodeId(sourcePackage)}->${packageNodeId(targetPackage)}`,
      source: packageNodeId(sourcePackage),
      target: packageNodeId(targetPackage),
      type: 'depends_on',
    });
  }

  if (input.fileContents) {
    const importEdges = buildImportEdges(input.fileContents, allFilePaths);
    edges.push(...importEdges);
  }

  const laidOut = applyDagreLayout(nodes, edges);
  return { nodes: laidOut, edges, layout: 'dagre' };
}
