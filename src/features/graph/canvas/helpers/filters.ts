import { useMemo } from 'react';
import type { GraphData } from '@/types';

interface UseNodeFilteringProps {
  graph: GraphData;
  readOnly?: boolean;
  searchQuery: string;
  nodeTypeFilters: Set<string>;
  diffStatusFilters: Set<string>;
  fileTypeFilters: Set<string>;
  activeFocusLayer: string | null;
}

export function useNodeFiltering({
  graph,
  readOnly,
  searchQuery,
  nodeTypeFilters,
  diffStatusFilters,
  fileTypeFilters,
  activeFocusLayer,
}: UseNodeFilteringProps) {
  return useMemo(() => {
    if (readOnly) return graph;
    const q = searchQuery.toLowerCase();
    let nodes = graph.nodes.filter((n) => nodeTypeFilters.has(n.type));

    if (diffStatusFilters.size > 0) {
      const matchingFilePaths = new Set(
        graph.nodes
          .filter(
            (n) =>
              n.type === "file" &&
              n.data.diffStatus &&
              diffStatusFilters.has(n.data.diffStatus),
          )
          .map((n) => n.data.path),
      );
      nodes = nodes.filter((n) => {
        if (n.type === "file")
          return n.data.diffStatus && diffStatusFilters.has(n.data.diffStatus);
        if (n.type === "folder" || n.type === "repo") {
          const folderPath = n.data.path;
          if (!folderPath) return true;
          for (const fp of matchingFilePaths) {
            if (fp && (fp === folderPath || fp.startsWith(folderPath + "/")))
              return true;
          }
          return false;
        }
        return true;
      });
    }

    if (q) {
      nodes = nodes.filter((n) => {
        const label = n.data.label ? String(n.data.label).toLowerCase() : "";
        const path = n.data.path ? String(n.data.path).toLowerCase() : "";
        return label.includes(q) || path.includes(q);
      });
    }

    if (fileTypeFilters.size > 0) {
      nodes = nodes.filter((n) => {
        if (n.type !== "file") return true;
        const path = n.data.path || n.id || "";
        const dotIdx = path.lastIndexOf(".");
        const ext = dotIdx >= 0 ? path.slice(dotIdx) : "other";
        const label = ext.startsWith(".") ? ext : `.${ext}`;
        return fileTypeFilters.has(label);
      });
    }

    if (activeFocusLayer && activeFocusLayer !== "all") {
      nodes = nodes.filter((n) => {
        if (n.type === "repo") return true;
        const path = n.data.path ? String(n.data.path).toLowerCase() : "";
        const ext = n.data.extension
          ? String(n.data.extension).toLowerCase()
          : "";
        if (activeFocusLayer === "api")
          return (
            path.includes("api") ||
            path.includes("server") ||
            path.includes("route") ||
            path.includes("controller") ||
            path.includes("endpoints")
          );
        if (activeFocusLayer === "ui")
          return (
            path.includes("component") ||
            path.includes("page") ||
            path.includes("style") ||
            path.includes("view") ||
            ["tsx", "jsx", "css"].includes(ext)
          );
        if (activeFocusLayer === "core")
          return (
            path.includes("service") ||
            path.includes("util") ||
            path.includes("helper") ||
            path.includes("lib") ||
            path.includes("core") ||
            ["rs", "go", "py", "ts", "js"].includes(ext)
          );
        if (activeFocusLayer === "config")
          return (
            ext === "json" ||
            ext === "yaml" ||
            ext === "yml" ||
            ext === "toml" ||
            path.includes("config") ||
            path.includes("webpack") ||
            path.includes("vite")
          );
        return true;
      });
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = graph.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
    );
    return { nodes, edges };
  }, [
    graph,
    searchQuery,
    nodeTypeFilters,
    diffStatusFilters,
    fileTypeFilters,
    readOnly,
    activeFocusLayer,
  ]);
}
