import { useEffect, useMemo, useCallback, useState, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalyzeRepo } from "@/hooks/useAnalyzeRepo";
import { useVizStore } from "@/stores/vizStore";
import { useVizDiff } from "@/hooks/useVizDiff";
import { useCodeInspectorState } from "@/hooks/useCodeInspectorState";
import { useWorkspaceShortcuts } from "@/hooks/useWorkspaceShortcuts";
import { TopNav } from "@/components/viz/top-nav/TopNav";
import { AISidebar } from "@/components/viz/AISidebar";

const GraphCanvas = lazy(() =>
  import("@/features/graph/canvas/GraphCanvas").then((m) => ({ default: m.GraphCanvas })),
);

const ArchitectureView = lazy(() =>
  import("@/components/viz/ArchitectureView").then((m) => ({ default: m.ArchitectureView })),
);
import { ContributorsView } from "@/components/contributors/ContributorsView";
import { ExplorerPanel } from "@/components/explorer/ExplorerPanel";
import { VizError } from "@/components/viz/VizError";
import { Info, Loader2 } from "lucide-react";
import { StagedLoader } from "@/components/viz/StagedLoader";
import { Card } from "@/components/ui/card";
import type { GraphNode } from "@/types";
import { FullCommitHistoryView } from "@/components/timeline/CommitHistoryView";
import { BottomStatusBar } from "@/components/viz/BottomStatusBar";
import { CodeInspectorDock } from "@/components/explorer/CodeInspectorDock";
import { VizSidebar } from "@/components/viz/layout/VizSidebar";
import { fitWorkspacePanels } from "@/lib/workspace-panels";

export function VizPage() {
  const { owner = "", repo = "" } = useParams();
  const { selectedBranch, compareBranch } = useVizStore();

  // Fetch selected/active branch analysis
  const { data, isLoading, error } = useAnalyzeRepo(
    owner,
    repo,
    selectedBranch,
  );

  // Fetch comparison branch analysis
  const { data: compareData } = useAnalyzeRepo(
    owner,
    repo,
    compareBranch,
    !!compareBranch,
  );

  const {
    reset,
    focusedFilePath,
    setFocusedFilePath,
    selectedNodeId,
    activeView,
    toastMessage,
    setToastMessage,
    explorerOpen,
    aiSidebarOpen,
    setAiSidebarOpen,
    setExplorerOpen,
    activeRepoKey,
    setActiveRepoKey,
  } = useVizStore();

  const selectedFilePath = focusedFilePath;

  // Code Inspector state & auto-open helpers
  const {
    codeInspectorState,
    setCodeInspectorState,
    setPreferredOpenState,
  } = useCodeInspectorState(focusedFilePath);

  // Resizable columns state
  const [leftWidth, setLeftWidth] = useState(240);
  const [rightWidth, setRightWidth] = useState(360);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const minibarWidth = viewportWidth >= 1024 ? (Number(!explorerOpen) + Number(!aiSidebarOpen)) * 40 : 0;
  const panelWidths = fitWorkspacePanels(viewportWidth - minibarWidth, explorerOpen ? leftWidth : 0, aiSidebarOpen ? rightWidth : 0);
  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const [showMinimap, setShowMinimap] = useState(false);

  // Workspace layout and global shortcut integration
  useWorkspaceShortcuts();

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");

    const closeMobileSidebars = () => {
      if (!media.matches) return;
      setExplorerOpen(false);
      setAiSidebarOpen(false);
    };

    closeMobileSidebars();
    media.addEventListener("change", closeMobileSidebars);

    return () => media.removeEventListener("change", closeMobileSidebars);
  }, [setAiSidebarOpen, setExplorerOpen]);

  // Compute file map structures, repository graphs, and branch diff calculations
  const { graphDiff, combinedGraph } = useVizDiff(data, compareBranch, compareData);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, setToastMessage]);

  const handleSelectFile = useCallback(
    (path: string) => {
      const node = (combinedGraph || data?.graph)?.nodes.find((item) => item.type === 'file' && item.data.path === path);
      useVizStore.setState({ focusedFilePath: path, selectedNodeId: node?.id ?? null, sidebarTab: 'analysis' });
      if (window.innerWidth >= 1024) {
        setAiSidebarOpen(true);
      } else {
        setExplorerOpen(false);
      }
    },
    [combinedGraph, data, setAiSidebarOpen, setExplorerOpen],
  );

  // Reset state when navigating to a different repo
  useEffect(() => {
    const key = `${owner}/${repo}`;
    if (activeRepoKey !== key) {
      reset();
      setActiveRepoKey(key);
      if (window.matchMedia("(max-width: 1023px)").matches) {
        setExplorerOpen(false);
        setAiSidebarOpen(false);
      }
    }
  }, [owner, repo, activeRepoKey, reset, setActiveRepoKey, setExplorerOpen, setAiSidebarOpen]);

  const nodeById = useMemo(() => {
    if (!data) return new Map();
    return new Map(data.graph.nodes.map((n) => [n.id, n]));
  }, [data]);

  const selectedNode = useMemo<GraphNode | null>(() => {
    if (!data || !selectedNodeId) return null;
    return nodeById.get(selectedNodeId) ?? null;
  }, [data, selectedNodeId, nodeById]);

  useEffect(() => {
    if (selectedNode?.type === "file" && selectedNode.data.path) {
      setFocusedFilePath(selectedNode.data.path);
    } else if (selectedNode) {
      setFocusedFilePath(null);
    }
  }, [selectedNode, setFocusedFilePath]);

  if (error) {
    return (
      <VizError
        error={error instanceof Error ? error.message : String(error)}
      />
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <TopNav analysis={data} meta={data?.meta} owner={owner} repo={repo} />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {isLoading ? (
            <StagedLoader owner={owner} repo={repo} />
          ) : data ? (
            <div className="flex min-h-0 flex-1 overflow-hidden relative">
              {/* Left Sidebar wrapper */}
              <VizSidebar
                side="left"
                isOpen={explorerOpen}
                width={panelWidths.left || leftWidth}
                onWidthChange={setLeftWidth}
                minWidth={180}
                maxWidth={Math.max(180, Math.min(450, viewportWidth - 360 - panelWidths.right))}
                onClose={() => setExplorerOpen(false)}
                onOpen={() => setExplorerOpen(true)}
              >
                <ExplorerPanel
                  analysis={data}
                  selectedFilePath={selectedFilePath}
                  onSelectFile={handleSelectFile}
                />
              </VizSidebar>

              {/* Center Workspace */}
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-background flex flex-col"
              >
                <div className="flex-1 min-h-0 relative">
                  <Suspense fallback={
                    <div role="status" className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin text-accent" /> Loading graph…
                    </div>
                  }>
                    <div
                      className={`h-full w-full relative ${activeView !== "graph" ? "hidden" : ""
                        }`}
                    >
                      <GraphCanvas
                        graph={combinedGraph || data.graph}
                        showMinimap={showMinimap}
                        setShowMinimap={setShowMinimap}
                      />
                      {data.treeTruncated && (
                        <div className="pointer-events-none absolute left-3 bottom-16 z-10 rounded-md bg-card px-3 py-2 text-xs text-muted-foreground ring-1 ring-border">
                          Partial repository tree: some files are unavailable.
                        </div>
                      )}
                    </div>
                  </Suspense>

                  {activeView === "architecture" && (
                    <Suspense fallback={
                      <div role="status" className="flex h-full w-full items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-accent" /> Loading architecture…
                      </div>
                    }>
                      <ArchitectureView
                        analysis={data}
                        owner={owner}
                        repo={repo}
                      />
                    </Suspense>
                  )}
                  {activeView === "contributors" && (
                    <ContributorsView
                      analysis={data}
                      owner={owner}
                      repo={repo}
                    />
                  )}
                  {activeView === "commits" && (
                    <FullCommitHistoryView
                      timeline={data.timeline}
                      owner={owner}
                      repo={repo}
                      branch={selectedBranch}
                      isLoading={isLoading}
                    />
                  )}
                </div>

                {focusedFilePath && codeInspectorState !== 'closed' && (
                  <CodeInspectorDock
                    state={codeInspectorState}
                    setState={(s) => {
                      setCodeInspectorState(s);
                      if (s === 'closed') {
                        useVizStore.setState({ focusedFilePath: null, selectedNodeId: null, highlightedNodeIds: new Set() });
                      } else {
                        setPreferredOpenState(s);
                      }
                    }}
                    filePath={focusedFilePath}
                    graph={combinedGraph || data.graph}
                    onSelectFile={handleSelectFile}
                    owner={owner}
                    repo={repo}
                  />
                )}
              </motion.section>

              {/* Right Sidebar wrapper */}
              <VizSidebar
                side="right"
                isOpen={aiSidebarOpen}
                width={panelWidths.right || rightWidth}
                onWidthChange={setRightWidth}
                minWidth={300}
                maxWidth={Math.max(300, Math.min(700, viewportWidth - 360 - panelWidths.left))}
                onClose={() => setAiSidebarOpen(false)}
                onOpen={() => setAiSidebarOpen(true)}
              >
                <AISidebar
                  analysis={data}
                  graphDiff={graphDiff}
                />
              </VizSidebar>
            </div>
          ) : null}
        </div>

        <BottomStatusBar
          analysis={data}
          showMinimap={showMinimap}
          activeView={activeView}
        />

        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-12 right-6 z-[9999]"
            >
              <Card role="status" className="flex items-center gap-2.5 border-border bg-card px-4 py-3 shadow-xl">
                <Info className="h-4 w-4 shrink-0 text-accent" />
                <div>
                  <p className="text-sm text-foreground break-words max-w-[280px] leading-relaxed">
                    {toastMessage}
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}

