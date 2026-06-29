import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NodeType } from "@/types";

export type SidebarTab = "overview" | "analysis" | "ai" | "learning";
export type LayoutType = "force" | "network";
export type WorkspaceMode = "focus" | "analysis" | "learning" | "full";
export type GraphScope = "important" | "source" | "grouped" | "full";
export type ContentFilter = "source" | "config" | "docs" | "tests" | "github" | "examples" | "generated" | "translations";

interface VizState {
  searchQuery: string;
  nodeTypeFilters: Set<NodeType>;
  fileTypeFilters: Set<string>;
  selectedNodeId: string | null;
  highlightedNodeIds: Set<string>;
  sidebarTab: SidebarTab;
  workspaceMode: WorkspaceMode;
  explorerOpen: boolean;
  aiSidebarOpen: boolean;
  inspectorOpen: boolean;
  focusedFilePath: string | null;
  onboardingStep: number;
  layoutType: LayoutType;
  toastMessage: string | null;
  theme: "dark" | "light";
  selectedBranch: string | null;
  compareBranch: string | null;
  availableBranches: string[];
  activeView: "graph" | "architecture" | "contributors" | "commits";
  zoom: number;
  visibleNodeCount: number;
  visibleEdgeCount: number;
  activeRepoKey: string | null;

  // Interactive upgrades
  hoveredNodeId: string | null;
  hoveredConnectedIds: Set<string>;
  executionFlowActive: boolean;
  executionFlowStep: number;
  executionFlowPaths: string[];
  activeFocusLayer: "all" | "api" | "ui" | "core" | "config";
  diffStatusFilters: Set<"added" | "modified" | "deleted">;
  blastRadiusActive: boolean;

  graphScope: GraphScope;
  contentFilters: Set<ContentFilter>;

  // Graph sidebar state
  graphSidebarOpen: boolean;
  graphSidebarSections: {
    nodeInfo: boolean;
    tools: boolean;
    nodeTypes: boolean;
    fileTypes: boolean;
    compare: boolean;
  };

  // Shared UI synchronization states
  activeDropdown: "filter" | "layout" | "export" | null;
  legendOpen: boolean;
  graphActionTrigger: {
    action: "zoomIn" | "zoomOut" | "fitView" | "reset" | "focusGraph";
    timestamp: number;
  } | null;

  setGraphScope: (scope: GraphScope) => void;
  toggleContentFilter: (filter: ContentFilter) => void;
  setContentFilters: (filters: Set<ContentFilter>) => void;

  toggleDiffStatusFilter: (status: "added" | "modified" | "deleted") => void;
  setSelectedBranch: (branch: string | null) => void;
  setCompareBranch: (branch: string | null) => void;
  setAvailableBranches: (branches: string[]) => void;
  setToastMessage: (msg: string | null) => void;
  setSearchQuery: (q: string) => void;
  toggleNodeTypeFilter: (type: NodeType) => void;
  toggleFileTypeFilter: (type: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setHighlightedNodeIds: (ids: Set<string>) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  setExplorerOpen: (open: boolean) => void;
  setAiSidebarOpen: (open: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
  setFocusedFilePath: (path: string | null) => void;
  setOnboardingStep: (step: number) => void;
  setLayoutType: (type: LayoutType) => void;
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  setZoom: (zoom: number) => void;
  setVisibleCounts: (nodes: number, edges: number) => void;

  setHoveredNodeId: (id: string | null) => void;
  setHoveredConnectedIds: (ids: Set<string>) => void;
  setExecutionFlowActive: (active: boolean) => void;
  setExecutionFlowStep: (step: number) => void;
  setExecutionFlowPaths: (paths: string[]) => void;
  setActiveFocusLayer: (
    layer: "all" | "api" | "ui" | "core" | "config",
  ) => void;
  setActiveView: (
    view: "graph" | "architecture" | "contributors" | "commits",
  ) => void;
  setBlastRadiusActive: (active: boolean) => void;
  setGraphSidebarOpen: (open: boolean) => void;
  toggleGraphSidebarSection: (
    key: keyof VizState["graphSidebarSections"],
  ) => void;
  resetFilters: () => void;

  setActiveDropdown: (dropdown: "filter" | "layout" | "export" | null) => void;
  setLegendOpen: (open: boolean) => void;
  triggerGraphAction: (action: "zoomIn" | "zoomOut" | "fitView" | "reset" | "focusGraph") => void;

  setActiveRepoKey: (key: string | null) => void;
  reset: () => void;
}

const defaultFilters = new Set<NodeType>(["repo", "package", "folder", "file"]);
const defaultContentFilters = new Set<ContentFilter>(["source", "config"]);

export const useVizStore = create<VizState>()(
  persist(
    (set) => ({
      searchQuery: "",
      nodeTypeFilters: new Set(defaultFilters),
      fileTypeFilters: new Set(),
      selectedNodeId: null,
      highlightedNodeIds: new Set(),
      sidebarTab: "overview",
      workspaceMode: "full",
      explorerOpen: true,
      aiSidebarOpen: true,
      inspectorOpen: false,
      focusedFilePath: null,
      onboardingStep: 0,
      layoutType: "force",
      zoom: 1.0,
      visibleNodeCount: 0,
      visibleEdgeCount: 0,
      toastMessage: null,
      theme: "dark",
      selectedBranch: null,
      compareBranch: null,
      availableBranches: [],
      activeView: "graph",
      activeRepoKey: null,

  hoveredNodeId: null,
  hoveredConnectedIds: new Set(),
  executionFlowActive: false,
  executionFlowStep: 0,
  executionFlowPaths: [],
  activeFocusLayer: "all",
  diffStatusFilters: new Set(),
  blastRadiusActive: false,

  graphScope: "source",
  contentFilters: new Set(defaultContentFilters),

  graphSidebarOpen: true,
  graphSidebarSections: {
    nodeInfo: true,
    tools: false,
    nodeTypes: true,
    fileTypes: false,
    compare: true,
  },

  activeDropdown: null,
  legendOpen: false,
  graphActionTrigger: null,

  setGraphScope: (graphScope: GraphScope) => set((s: VizState) => {
    let newContentFilters = new Set(s.contentFilters);
    if (graphScope === 'full') {
      newContentFilters = new Set(["source", "config", "docs", "tests", "github", "examples", "generated", "translations"]);
    } else if (graphScope === 'source' || graphScope === 'important' || graphScope === 'grouped') {
      newContentFilters = new Set(["source", "config"]);
    }
    return { graphScope, contentFilters: newContentFilters };
  }),
  toggleContentFilter: (filter: ContentFilter) =>
    set((s: VizState) => {
      const next = new Set(s.contentFilters);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return { contentFilters: next };
    }),
  setContentFilters: (contentFilters: Set<ContentFilter>) => set({ contentFilters }),

  toggleDiffStatusFilter: (status: "added" | "modified" | "deleted") =>
    set((s: VizState) => {
      const next = new Set(s.diffStatusFilters);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return { diffStatusFilters: next };
    }),
  setSelectedBranch: (selectedBranch: string | null) => set({ selectedBranch }),
  setCompareBranch: (compareBranch: string | null) =>
    set((s: VizState) => ({
      compareBranch,
      diffStatusFilters: compareBranch ? s.diffStatusFilters : new Set(),
    })),
  setAvailableBranches: (availableBranches: string[]) => set({ availableBranches }),
  setToastMessage: (toastMessage: string | null) => set({ toastMessage }),
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
  toggleNodeTypeFilter: (type: NodeType) =>
    set((s: VizState) => {
      const next = new Set(s.nodeTypeFilters);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return { nodeTypeFilters: next };
    }),
  toggleFileTypeFilter: (type: string) =>
    set((s: VizState) => {
      const next = new Set(s.fileTypeFilters);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return { fileTypeFilters: next };
    }),
  setSelectedNodeId: (selectedNodeId: string | null) => set({ selectedNodeId }),
  setHighlightedNodeIds: (highlightedNodeIds: Set<string>) => set({ highlightedNodeIds }),
  setSidebarTab: (sidebarTab: SidebarTab) => set({ sidebarTab }),
  setWorkspaceMode: (workspaceMode: WorkspaceMode) => set({ workspaceMode }),
  setExplorerOpen: (explorerOpen: boolean) => set({ explorerOpen }),
  setAiSidebarOpen: (aiSidebarOpen: boolean) => set({ aiSidebarOpen }),
  setInspectorOpen: (inspectorOpen: boolean) => set({ inspectorOpen }),
  setFocusedFilePath: (focusedFilePath: string | null) => set({ focusedFilePath }),
  setOnboardingStep: (onboardingStep: number) => set({ onboardingStep }),
  setLayoutType: (layoutType: LayoutType) => set({ layoutType }),
  setZoom: (zoom: number) => set({ zoom }),
  setVisibleCounts: (visibleNodeCount: number, visibleEdgeCount: number) => set({ visibleNodeCount, visibleEdgeCount }),
  setTheme: (theme: "dark" | "light") => {
    if (typeof window !== "undefined") localStorage.setItem("theme", theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((s: VizState) => {
      const nextTheme = s.theme === "dark" ? "light" : "dark";
      if (typeof window !== "undefined")
         localStorage.setItem("theme", nextTheme);
      return { theme: nextTheme };
    }),

  setHoveredNodeId: (hoveredNodeId: string | null) => set({ hoveredNodeId }),
  setHoveredConnectedIds: (hoveredConnectedIds: Set<string>) => set({ hoveredConnectedIds }),
  setExecutionFlowActive: (executionFlowActive: boolean) => set({ executionFlowActive }),
  setExecutionFlowStep: (executionFlowStep: number) => set({ executionFlowStep }),
  setExecutionFlowPaths: (executionFlowPaths: string[]) => set({ executionFlowPaths }),
  setActiveFocusLayer: (activeFocusLayer: "all" | "api" | "ui" | "core" | "config") => set({ activeFocusLayer }),
  setActiveView: (activeView: "graph" | "architecture" | "contributors" | "commits") => set({ activeView }),
  setBlastRadiusActive: (blastRadiusActive: boolean) => set({ blastRadiusActive }),
  setGraphSidebarOpen: (graphSidebarOpen: boolean) => set({ graphSidebarOpen }),
  toggleGraphSidebarSection: (key: keyof VizState["graphSidebarSections"]) =>
    set((s: VizState) => ({
      graphSidebarSections: {
        ...s.graphSidebarSections,
        [key]: !s.graphSidebarSections[key],
      },
    })),

  resetFilters: () =>
    set({
      nodeTypeFilters: new Set(defaultFilters),
      fileTypeFilters: new Set(),
      diffStatusFilters: new Set(),
      activeFocusLayer: "all",
      searchQuery: "",
      graphScope: "source",
      contentFilters: new Set(defaultContentFilters),
    }),

  setActiveDropdown: (activeDropdown: "filter" | "layout" | "export" | null) => set({ activeDropdown }),
  setLegendOpen: (legendOpen: boolean) => set({ legendOpen }),
  triggerGraphAction: (action: "zoomIn" | "zoomOut" | "fitView" | "reset" | "focusGraph") => set({ graphActionTrigger: { action, timestamp: Date.now() } }),

  setActiveRepoKey: (activeRepoKey: string | null) => set({ activeRepoKey }),

  reset: () =>
    set({
      searchQuery: "",
      nodeTypeFilters: new Set(defaultFilters),
      fileTypeFilters: new Set(),
      selectedNodeId: null,
      highlightedNodeIds: new Set(),
      sidebarTab: "overview",
      workspaceMode: "full",
      explorerOpen: true,
      aiSidebarOpen: true,
      inspectorOpen: false,
      focusedFilePath: null,
       onboardingStep: 0,
      layoutType: "force",
      zoom: 1.0,
      visibleNodeCount: 0,
      visibleEdgeCount: 0,
      toastMessage: null,
      selectedBranch: null,
      compareBranch: null,
      availableBranches: [],
      hoveredNodeId: null,
      hoveredConnectedIds: new Set(),
      executionFlowActive: false,
      executionFlowStep: 0,
      executionFlowPaths: [],
      activeFocusLayer: "all",
      diffStatusFilters: new Set(),
      activeView: "graph",
      blastRadiusActive: false,
      graphScope: "source",
      contentFilters: new Set(defaultContentFilters),
      activeDropdown: null,
      legendOpen: false,
      graphActionTrigger: null,
    }),
  }),
  {
    name: 'gitsdm-viz-storage',
    partialize: (state) => ({
      workspaceMode: state.workspaceMode,
      explorerOpen: state.explorerOpen,
      aiSidebarOpen: state.aiSidebarOpen,
      inspectorOpen: state.inspectorOpen,
      sidebarTab: state.sidebarTab,
      layoutType: state.layoutType,
      theme: state.theme,
      activeView: state.activeView,
      graphSidebarOpen: state.graphSidebarOpen,
      activeDropdown: state.activeDropdown,
      legendOpen: state.legendOpen,
      graphScope: state.graphScope,
      contentFilters: Array.from(state.contentFilters),
    }),
    merge: (persistedState: unknown, currentState: VizState): VizState => {
      const p = persistedState as Partial<Omit<VizState, 'contentFilters'> & { contentFilters: ContentFilter[] }>;
      return {
        ...currentState,
        ...p,
        contentFilters: p?.contentFilters
          ? new Set(p.contentFilters)
          : currentState.contentFilters,
      } as VizState;
    },
  }
));
