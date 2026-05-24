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
import { StatsDrawer } from '@/components/viz/StatsDrawer';
import { ExplorerPanel } from '@/components/explorer/ExplorerPanel';
import { CodeInspectorView } from '@/components/explorer/CodeInspectorView';
import { FileTypeLegend } from '@/components/viz/FileTypeLegend';
import { VizError } from '@/components/viz/VizError';
import { Check } from 'lucide-react';
import { StagedLoader } from '@/components/viz/StagedLoader';
import type { GraphNode } from '@/types';
import { useExplain } from '@/features/ai/useAI';

export function VizPage() {
  const { owner = '', repo = '' } = useParams();
  const { data, isLoading, error } = useAnalyzeRepo(owner, repo);
  const {
    reset,
    selectedNodeId,
    setSelectedNodeId,
    setInspectorOpen,
    inspectorOpen,
    setFocusedFilePath,
    focusedFilePath,
    toastMessage,
    setToastMessage,
  } = useVizStore();
  const selectedFilePath = focusedFilePath;
  const explain = useExplain();

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
    setFocusedFilePath(null);
    setInspectorOpen(false);
    setSelectedNodeId(null);
  }, [setFocusedFilePath, setInspectorOpen, setSelectedNodeId]);

  useEffect(() => {
    reset();
    return () => reset();
  }, [owner, repo, reset]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        handleCloseInspector();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSelectedNodeId, handleCloseInspector]);

  const selectedNode = useMemo<GraphNode | null>(() => {
    if (!data || !selectedNodeId) return null;
    return data.graph.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [data, selectedNodeId]);

  useEffect(() => {
    if (selectedNode?.type === 'file' && selectedNode.data.path) {
      setFocusedFilePath(selectedNode.data.path);
      setInspectorOpen(true);
    }
  }, [selectedNode, setFocusedFilePath, setInspectorOpen]);

  useEffect(() => {
    if (selectedNodeId && data) {
      explain.mutate({
        owner: data.meta.owner,
        repo: data.meta.repo,
        scope: 'node',
        nodeId: selectedNodeId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId, data?.meta.owner, data?.meta.repo]);

  if (error) {
    return <VizError message={error instanceof Error ? error.message : 'Unknown error'} />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950">
      <VizTopBar meta={data?.meta} />
      <FilterBar />

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

            {inspectorOpen && (
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
              <ReactFlowProvider>
                <GraphFocusSync />
                <GraphCanvas graph={data.graph} />
              </ReactFlowProvider>
              <FileTypeLegend graph={data.graph} />
              {data.treeTruncated && (
                <div className="absolute left-3 top-2 z-10 rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] text-amber-300 ring-1 ring-amber-500/20">
                  Tree truncated
                </div>
              )}
            </motion.section>

            <div className="hidden h-full w-[360px] shrink-0 lg:block">
              <AISidebar analysis={data} />
            </div>
          </div>
        ) : null}
      </div>

      {data && <StatsDrawer analysis={data} />}

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
