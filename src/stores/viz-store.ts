import { create } from 'zustand';
import type { NodeType } from '@/types';

export type SidebarTab = 'explain' | 'dependencies';
export type LayoutType = 'TB' | 'LR' | 'force';

interface VizState {
  searchQuery: string;
  nodeTypeFilters: Set<NodeType>;
  selectedNodeId: string | null;
  highlightedNodeIds: Set<string>;
  sidebarTab: SidebarTab;
  drawerOpen: boolean;
  explorerOpen: boolean;
  inspectorOpen: boolean;
  focusedFilePath: string | null;
  onboardingStep: number;
  layoutType: LayoutType;
  toastMessage: string | null;
  theme: 'dark' | 'light';
  setToastMessage: (msg: string | null) => void;
  setSearchQuery: (q: string) => void;
  toggleNodeTypeFilter: (type: NodeType) => void;
  setSelectedNodeId: (id: string | null) => void;
  setHighlightedNodeIds: (ids: Set<string>) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setDrawerOpen: (open: boolean) => void;
  setExplorerOpen: (open: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
  setFocusedFilePath: (path: string | null) => void;
  setOnboardingStep: (step: number) => void;
  setLayoutType: (type: LayoutType) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  reset: () => void;
}

const defaultFilters = new Set<NodeType>(['repo', 'folder', 'file']);

export const useVizStore = create<VizState>((set) => ({
  searchQuery: '',
  nodeTypeFilters: new Set(defaultFilters),
  selectedNodeId: null,
  highlightedNodeIds: new Set(),
  sidebarTab: 'explain',
  drawerOpen: false,
  explorerOpen: true,
  inspectorOpen: false,
  focusedFilePath: null,
  onboardingStep: 0,
  layoutType: 'force',
  toastMessage: null,
  theme: (typeof window !== 'undefined' ? (localStorage.getItem('theme') ?? 'dark') : 'dark') as 'dark' | 'light',
  setToastMessage: (toastMessage) => set({ toastMessage }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleNodeTypeFilter: (type) =>
    set((s) => {
      const next = new Set(s.nodeTypeFilters);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return { nodeTypeFilters: next };
    }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setHighlightedNodeIds: (highlightedNodeIds) => set({ highlightedNodeIds }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  setExplorerOpen: (explorerOpen) => set({ explorerOpen }),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
  setFocusedFilePath: (focusedFilePath) => set({ focusedFilePath }),
  setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
  setLayoutType: (layoutType) => set({ layoutType }),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') localStorage.setItem('theme', theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((s) => {
      const nextTheme = s.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') localStorage.setItem('theme', nextTheme);
      return { theme: nextTheme };
    }),
  reset: () =>
    set({
      searchQuery: '',
      nodeTypeFilters: new Set(defaultFilters),
      selectedNodeId: null,
      highlightedNodeIds: new Set(),
      sidebarTab: 'explain',
      drawerOpen: false,
      explorerOpen: true,
      inspectorOpen: false,
      focusedFilePath: null,
      onboardingStep: 0,
      layoutType: 'force',
      toastMessage: null,
    }),
}));
