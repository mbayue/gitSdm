import { useMemo } from "react";
import type { GraphNode, TreeNode, RepoAnalysis } from "@/types";

interface UseVizDiffResult {
  fileShaMaps: {
    selected: Map<string, string>;
    compare: Map<string, string>;
  };
  graphDiff: {
    added: Set<string>;
    modified: Set<string>;
    deleted: Set<string>;
  } | null;
  combinedGraph: RepoAnalysis["graph"] | null;
}

export function useVizDiff(
  data: RepoAnalysis | undefined,
  compareBranch: string | null,
  compareData: RepoAnalysis | undefined,
): UseVizDiffResult {
  // Recursively map file paths to their tree node SHA
  const fileShaMaps = useMemo(() => {
    if (!data) {
      return {
        selected: new Map<string, string>(),
        compare: new Map<string, string>(),
      };
    }

    const buildShaMap = (
      nodes: TreeNode[],
      map = new Map<string, string>(),
    ) => {
      for (const node of nodes) {
        if (node.type === "file" && node.sha) {
          map.set(node.path, node.sha);
        } else if (node.children) {
          buildShaMap(node.children, map);
        }
      }
      return map;
    };

    const selected = buildShaMap(data.tree);
    const compare = compareData
      ? buildShaMap(compareData.tree)
      : new Map<string, string>();
    return { selected, compare };
  }, [data, compareData]);

  // Compute graph diff status
  const graphDiff = useMemo(() => {
    if (!compareBranch || !data || !compareData) return null;

    const { selected: selectedMap, compare: compareMap } = fileShaMaps;
    const added = new Set<string>();
    const modified = new Set<string>();
    const deleted = new Set<string>();

    // 1. Files in selected but not compare
    for (const [path, sha] of selectedMap.entries()) {
      if (!compareMap.has(path)) {
        added.add(path);
      } else if (compareMap.get(path) !== sha) {
        modified.add(path);
      }
    }

    // 2. Files in compare but not selected
    for (const path of compareMap.keys()) {
      if (!selectedMap.has(path)) {
        deleted.add(path);
      }
    }

    return { added, modified, deleted };
  }, [compareBranch, data, compareData, fileShaMaps]);

  // Build the combined graph showing added, modified, and deleted elements
  const combinedGraph = useMemo(() => {
    if (!data) return null;

    const healthReport = data.dependencyHealth;
    const outdatedPackages = new Set<string>();
    if (healthReport && healthReport.items) {
      for (const item of healthReport.items) {
        if (item.state === 'outdated') {
          outdatedPackages.add(item.name);
        }
      }
    }

    if (!compareBranch || !compareData || !graphDiff) {
      return {
        ...data.graph,
        nodes: data.graph.nodes.map((n) => {
          const isOutdated =
            (n.type === 'package' &&
              healthReport?.items?.some((item) => {
                if (item.state !== 'outdated') return false;
                if (item.packageNames.includes(n.data.label)) return true;
                const rootPath = n.data.path || '';
                const expectedManifest = rootPath === '.' || rootPath === '' 
                  ? 'package.json' 
                  : `${rootPath}/package.json`;
                return item.manifestPaths.includes(expectedManifest);
              })) ||
            (n.type === 'file' &&
              n.data.path &&
              (n.data.path === 'package.json' || n.data.path.endsWith('/package.json')) &&
              healthReport?.items?.some(
                (item) => item.state === 'outdated' && item.manifestPaths.includes(n.data.path || '')
              ));
          if (isOutdated) {
            return {
              ...n,
              data: {
                ...n.data,
                hasOutdatedDeps: true,
              },
            };
          }
          return n;
        }),
      };
    }

    const nodesMap = new Map(
      data.graph.nodes.map((n) => {
        const isOutdated =
          (n.type === 'package' &&
            healthReport?.items?.some((item) => {
              if (item.state !== 'outdated') return false;
              if (item.packageNames.includes(n.data.label)) return true;
              const rootPath = n.data.path || '';
              const expectedManifest = rootPath === '.' || rootPath === '' 
                ? 'package.json' 
                : `${rootPath}/package.json`;
              return item.manifestPaths.includes(expectedManifest);
            })) ||
          (n.type === 'file' &&
            n.data.path &&
            (n.data.path === 'package.json' || n.data.path.endsWith('/package.json')) &&
            healthReport?.items?.some(
              (item) => item.state === 'outdated' && item.manifestPaths.includes(n.data.path || '')
            ));
        return [
          n.id,
          {
            ...n,
            data: {
              ...n.data,
              hasOutdatedDeps: isOutdated || undefined,
            },
          },
        ];
      }),
    );

    // Annotate current nodes with diff statuses
    for (const [id, node] of nodesMap.entries()) {
      const path = node.data.path;
      if (graphDiff.added.has(id) || (path && graphDiff.added.has(path))) {
        node.data.diffStatus = "added";
      } else if (
        graphDiff.modified.has(id) ||
        (path && graphDiff.modified.has(path))
      ) {
        node.data.diffStatus = "modified";
      }
    }

    // Find deleted nodes from compareData
    const deletedNodes: GraphNode[] = [];
    for (const node of compareData.graph.nodes) {
      if (!nodesMap.has(node.id)) {
        const path = node.data.path;
        const isFileDeleted =
          node.type === "file" && path && graphDiff.deleted.has(path);
        const isFolderDeleted =
          node.type === "folder" &&
          node.id &&
          !data.graph.nodes.some((n) => n.id === node.id);

        if (isFileDeleted || isFolderDeleted) {
          deletedNodes.push({
            ...node,
            data: {
              ...node.data,
              diffStatus: "deleted",
            },
          });
        }
      }
    }

    // Combine edges
    const edgesMap = new Map(data.graph.edges.map((e) => [e.id, { ...e }]));
    const currentNodesKeys = new Set(nodesMap.keys());
    const deletedNodesKeys = new Set(deletedNodes.map((n) => n.id));
    const allKeys = new Set([...currentNodesKeys, ...deletedNodesKeys]);

    for (const edge of compareData.graph.edges) {
      if (allKeys.has(edge.source) && allKeys.has(edge.target)) {
        if (!edgesMap.has(edge.id)) {
          edgesMap.set(edge.id, { ...edge });
        }
      }
    }

    return {
      nodes: [...Array.from(nodesMap.values()), ...deletedNodes],
      edges: Array.from(edgesMap.values()),
      layout: data.graph.layout,
    };
  }, [data, compareBranch, compareData, graphDiff]);

  return { fileShaMaps, graphDiff, combinedGraph };
}
