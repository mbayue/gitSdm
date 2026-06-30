import { useEffect, useMemo, useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GraphCanvas } from "@/features/graph/canvas/GraphCanvas";
import { useAnalyzeRepo } from "@/hooks/useAnalyzeRepo";
import { useVizStore } from "@/stores/vizStore";
import { useVizDiff } from "@/hooks/useVizDiff";
import { useCodeInspectorState } from "@/hooks/useCodeInspectorState";
import { useWorkspaceShortcuts } from "@/hooks/useWorkspaceShortcuts";
import { TopNav } from "@/components/viz/top-nav/TopNav";
import { AISidebar } from "@/components/viz/AISidebar";
import { ArchitectureView } from "@/components/viz/ArchitectureView";
import { ContributorsView } from "@/components/contributors/ContributorsView";
import { ExplorerPanel } from "@/components/explorer/ExplorerPanel";
import { VizError } from "@/components/viz/VizError";
import { Check } from "lucide-react";
import { StagedLoader } from "@/components/viz/StagedLoader";
import { Card } from "@/components/ui/card";
import type { GraphNode } from "@/types";
import { FullCommitHistoryView } from "@/components/timeline/CommitHistoryView";
import { BottomStatusBar } from "@/components/viz/BottomStatusBar";
import { CodeInspectorDock } from "@/components/explorer/CodeInspectorDock";
import { VizSidebar } from "@/components/viz/layout/VizSidebar";

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
    setSidebarTab,
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
      setFocusedFilePath(path);
      setSidebarTab("analysis");
      setAiSidebarOpen(true);
    },
    [setFocusedFilePath, setSidebarTab, setAiSidebarOpen],
  );

  // Reset state when navigating to a different repo
  useEffect(() => {
    const key = `${owner}/${repo}`;
    if (activeRepoKey !== key) {
      reset();
      setActiveRepoKey(key);
    }
  }, [owner, repo, activeRepoKey, reset, setActiveRepoKey]);

  const selectedNode = useMemo<GraphNode | null>(() => {
    if (!data || !selectedNodeId) return null;
    return data.graph.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [data, selectedNodeId]);

  useEffect(() => {
    if (selectedNode?.type === "file" && selectedNode.data.path) {
      setFocusedFilePath(selectedNode.data.path);
    } else {
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
    <div className="flex h-screen flex-col overflow-hidden bg-background">
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
                width={leftWidth}
                onWidthChange={setLeftWidth}
                minWidth={180}
                maxWidth={450}
                onClose={() => setExplorerOpen(false)}
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
                      <div className="absolute left-3 top-2 z-10 rounded-lg bg-[#1c2128] px-2 py-1 text-[10px] text-[#8b949e] ring-1 ring-[rgba(240,246,252,0.1)]">
                        Tree truncated
                      </div>
                    )}
                  </div>

                  {activeView === "architecture" && (
                    <ArchitectureView
                      analysis={data}
                      owner={owner}
                      repo={repo}
                    />
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
                        setFocusedFilePath(null);
                      } else {
                        setPreferredOpenState(s);
                      }
                    }}
                    filePath={focusedFilePath}
                    owner={owner}
                    repo={repo}
                  />
                )}
              </motion.section>

              {/* Right Sidebar wrapper */}
              <VizSidebar
                side="right"
                isOpen={aiSidebarOpen}
                width={rightWidth}
                onWidthChange={setRightWidth}
                minWidth={300}
                maxWidth={700}
                onClose={() => setAiSidebarOpen(false)}
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
              <Card className="flex items-center gap-2.5 border-border bg-card/95 px-4 py-3 shadow-xl backdrop-blur-md">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                  <Check className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Copied!</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 break-all max-w-[280px] font-mono leading-relaxed">
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

