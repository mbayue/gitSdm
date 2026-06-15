import { useMemo } from 'react';
import { useNodeFiltering } from '../helpers/filters';
import type { GraphData } from '@/types';
import { useVizStore } from '@/stores/vizStore';

export function useGraphCanvasState(graph: GraphData, readOnly?: boolean) {
  const {
    searchQuery,
    nodeTypeFilters,
    diffStatusFilters,
    fileTypeFilters,
    activeFocusLayer,
    layoutType,
    theme,
  } = useVizStore();

  const isDark = theme === 'dark';

  const defaultEdgeOptions = useMemo(() => ({
    type: layoutType === 'force' ? 'straight' : 'smoothstep',
    style: {
      stroke: isDark ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.15)',
      strokeWidth: isDark ? 1.35 : 1.2,
    },
  }), [isDark, layoutType]);

  const filtered = useNodeFiltering({
    graph,
    readOnly,
    searchQuery,
    nodeTypeFilters,
    diffStatusFilters,
    fileTypeFilters,
    activeFocusLayer,
  });

  const connectedNodeIdsByNodeId = useMemo(() => {
    const lookup = new Map<string, Set<string>>();
    for (const edge of filtered.edges) {
      if (!lookup.has(edge.source))
        lookup.set(edge.source, new Set([edge.source]));
      if (!lookup.has(edge.target))
        lookup.set(edge.target, new Set([edge.target]));
      lookup.get(edge.source)?.add(edge.target);
      lookup.get(edge.target)?.add(edge.source);
      lookup.get(edge.source)?.add(edge.source);
      lookup.get(edge.target)?.add(edge.target);
    }
    return lookup;
  }, [filtered.edges]);

  return {
    isDark,
    defaultEdgeOptions,
    filtered,
    connectedNodeIdsByNodeId,
  };
}
