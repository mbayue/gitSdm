import { useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphCanvas } from '@/features/graph/GraphCanvas';
import { GraphFocusSync } from '@/features/graph/GraphFocusSync';
import { useAnalyzeRepo } from '@/hooks/useAnalyzeRepo';
import { useVizStore } from '@/stores/viz-store';
import { VizTopBar } from '@/components/viz/VizTopBar';
import { FilterBar } from '@/components/viz/FilterBar';
import { AISidebar } from '@/components/viz/AISidebar';
import { FullArchitectureView } from '@/components/viz/FullArchitectureView';
import { FullContributorsView } from '@/components/contributors/FullContributorsView';
import { ExplorerPanel } from '@/components/explorer/ExplorerPanel';
import { CodeInspectorView } from '@/components/explorer/CodeInspectorView';
import { FileTypeLegend } from '@/components/viz/FileTypeLegend';
import { VizError } from '@/components/viz/VizError';
import { Check } from 'lucide-react';
import { StagedLoader } from '@/components/viz/StagedLoader';
import type { GraphNode, TreeNode } from '@/types';
import { CompareHUD } from '@/components/viz/CompareHUD';
import { FullCommitHistoryView } from '@/components/timeline/FullCommitHistoryView';

export function VizPage() {
  const { owner = '', repo = '' } = useParams();
  const { selectedBranch, compareBranch } = useVizStore();

  // Fetch selected/active branch analysis
  const { data, isLoading, error } = useAnalyzeRepo(owner, repo, selectedBranch);

  // Fetch comparison branch analysis
  const { data: compareData } = useAnalyzeRepo(
    owner,
    repo,
    compareBranch,
    !!compareBranch
  );

  const {
    reset,
    focusedFilePath,
    setFocusedFilePath,
    selectedNodeId,
    setSelectedNodeId,
    activeView,
    toastMessage,
    setToastMessage,
    inspectorOpen,
    setInspectorOpen,
  } = useVizStore();
  const selectedFilePath = focusedFilePath;

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, setToastMessage]);

  const handleSelectFile = useCallback(
    (path: string) => {
      setFocusedFilePath(path);
      setInspectorOpen(true);
    },
    [setFocusedFilePath, setInspectorOpen],
  );

  const handleCloseInspector = useCallback(() => {
    setInspectorOpen(false);
  }, [setInspectorOpen]);

  useEffect(() => {
    reset();
    return () => reset();
  }, [owner, repo, reset]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setFocusedFilePath(null);
        setInspectorOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSelectedNodeId, setFocusedFilePath, setInspectorOpen]);

  const selectedNode = useMemo<GraphNode | null>(() => {
    if (!data || !selectedNodeId) return null;
    return data.graph.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [data, selectedNodeId]);

  useEffect(() => {
    if (selectedNode?.type === 'file' && selectedNode.data.path) {
      setFocusedFilePath(selectedNode.data.path);
    }
  }, [selectedNode, setFocusedFilePath]);

  // Recursively map file paths to their tree node SHA
  const fileShaMaps = useMemo(() => {
    if (!data) return { selected: new Map<string, string>(), compare: new Map<string, string>() };

    const buildShaMap = (nodes: TreeNode[], map = new Map<string, string>()) => {
      for (const node of nodes) {
        if (node.type === 'file' && node.sha) {
          map.set(node.path, node.sha);
        } else if (node.children) {
          buildShaMap(node.children, map);
        }
      }
      return map;
    };

    const selected = buildShaMap(data.tree);
    const compare = compareData ? buildShaMap(compareData.tree) : new Map<string, string>();
    return { selected, compare };
  }, [data, compareData]);

  // Check if current file path actually exists in active repository data
  const fileExists = useMemo(() => {
    if (!selectedFilePath) return false;
    return fileShaMaps.selected.has(selectedFilePath) || fileShaMaps.compare.has(selectedFilePath);
  }, [selectedFilePath, fileShaMaps]);

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
    if (!compareBranch || !compareData || !graphDiff) return data.graph;

    const nodesMap = new Map(data.graph.nodes.map((n) => [n.id, { ...n, data: { ...n.data } }]));

    // Annotate current nodes with diff statuses
    for (const [id, node] of nodesMap.entries()) {
      const path = node.data.path;
      if (graphDiff.added.has(id) || (path && graphDiff.added.has(path))) {
        node.data.diffStatus = 'added';
      } else if (graphDiff.modified.has(id) || (path && graphDiff.modified.has(path))) {
        node.data.diffStatus = 'modified';
      }
    }

    // Find deleted nodes from compareData
    const deletedNodes: GraphNode[] = [];
    for (const node of compareData.graph.nodes) {
      if (!nodesMap.has(node.id)) {
        const path = node.data.path;
        const isFileDeleted = node.type === 'file' && path && graphDiff.deleted.has(path);
        const isFolderDeleted = node.type === 'folder' && node.id && !data.graph.nodes.some((n) => n.id === node.id);

        if (isFileDeleted || isFolderDeleted) {
          deletedNodes.push({
            ...node,
            data: {
              ...node.data,
              diffStatus: 'deleted',
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

  if (error) {
    return <VizError message={error instanceof Error ? error.message : 'Unknown error'} />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950">
      <VizTopBar meta={data?.meta} />
      <FilterBar owner={owner} repo={repo} analysis={data} />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <StagedLoader owner={owner} repo={repo} />
        ) : data ? (
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <ExplorerPanel
              analysis={data}
              selectedFilePath={selectedFilePath}
              onSelectFile={handleSelectFile}
            />

            {inspectorOpen && fileExists && (
              <div className="hidden h-full w-[min(360px,28vw)] max-w-[400px] shrink-0 border-r border-white/[0.06] lg:block">
                <CodeInspectorView
                  owner={data.meta.owner}
                  repo={data.meta.repo}
                  filePath={selectedFilePath}
                  onClose={handleCloseInspector}
                />
              </div>
            )}

             <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-zinc-950"
            >
              <div className={`h-full w-full relative ${activeView !== 'graph' ? 'hidden' : ''}`}>
                <ReactFlowProvider>
                  <GraphFocusSync />
                  <GraphCanvas graph={combinedGraph || data.graph} />
                </ReactFlowProvider>
                <FileTypeLegend graph={data.graph} />
                <CompareHUD diff={graphDiff} defaultBranch={data.meta.defaultBranch} />
                {data.treeTruncated && (
                  <div className="absolute left-3 top-2 z-10 rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] text-amber-300 ring-1 ring-amber-500/20">
                    Tree truncated
                  </div>
                )}
              </div>

              {activeView === 'architecture' && (
                <FullArchitectureView
                  analysis={data}
                  owner={owner}
                  repo={repo}
                />
              )}
              {activeView === 'contributors' && (
                <FullContributorsView
                  analysis={data}
                  owner={owner}
                  repo={repo}
                />
              )}
              {activeView === 'commits' && (
                <FullCommitHistoryView
                  timeline={data.timeline}
                  owner={owner}
                  repo={repo}
                  branch={selectedBranch}
                  isLoading={isLoading}
                />
              )}
            </motion.section>

            <div className="hidden h-full shrink-0 lg:block">
              <AISidebar analysis={data} />
            </div>
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-zinc-950/90 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-green-400">
              <Check className="h-3 w-3" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Copied!</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 break-all max-w-[280px] font-mono leading-relaxed">
                {toastMessage}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
