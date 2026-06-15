import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, FileText, Sparkles, PanelRightClose, PanelRightOpen, Info, GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVizStore, type SidebarTab } from '@/stores/vizStore';
import { aiArchitecture } from '@/lib/apiClient';
import type { AIArchitectureResponse, RepoAnalysis } from '@/types';

import { LearningPathTab } from './LearningPathTab';
import { OverviewTab } from './OverviewTab';
import { AnalysisTab } from './AnalysisTab';
import { AiCenterTab } from './ai-sidebar/AiCenterTab';

// Subcomponents & Helpers
import { getBlastRadiusNodeIds } from '@/features/graph/canvas/helpers/blastRadiusLayout';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Tabs definition matching Segmented Tab specifications
const tabs = [
  { id: 'overview' as SidebarTab, label: 'Overview', icon: Info },
  { id: 'analysis' as SidebarTab, label: 'Detail', icon: FileText },
  { id: 'ai' as SidebarTab, label: 'AI', icon: Brain },
  { id: 'learning' as SidebarTab, label: 'Learn', icon: GraduationCap },
];

interface AISidebarProps {
  analysis: RepoAnalysis;
  style?: React.CSSProperties;
  graphDiff?: {
    added: Set<string>;
    modified: Set<string>;
    deleted: Set<string>;
  } | null;
}

// 1. SidebarHeader Component
interface SidebarHeaderProps {
  onClose: () => void;
}

function SidebarHeader({ onClose }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between shrink-0 border-b border-white/[0.05] bg-zinc-950/80 px-4 py-3.5 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-400 animate-pulse" />
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-200 font-mono">
          Contextual Analysis
        </h2>
      </div>
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-colors outline-none cursor-pointer"
        >
          <PanelRightClose className="h-4.5 w-4.5" />
        </TooltipTrigger>
        <TooltipContent side="left">Hide sidebar panel</TooltipContent>
      </Tooltip>
    </div>
  );
}

// 2. TabNavigation Component (Segmented tab bar)
interface TabNavigationProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
}

function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  return (
    <div className="flex items-center gap-0.5 p-1 bg-zinc-950/65 rounded-xl border border-white/[0.04] w-full overflow-x-auto [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 min-w-[62px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 outline-none select-none shrink-0",
              isActive
                ? "bg-violet-600/10 text-violet-350 border border-violet-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]"
                : "text-zinc-500 hover:text-zinc-350 hover:bg-white/[0.02] border border-transparent"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5 shrink-0 transition-colors", isActive ? "text-violet-400" : "text-zinc-650")} />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}


export function AISidebar({
  analysis,
  style,
  graphDiff,
}: AISidebarProps) {
  const {
    sidebarTab,
    setSidebarTab,
    selectedNodeId,
    setSelectedNodeId,
    selectedBranch,
    aiSidebarOpen,
    setAiSidebarOpen,
    blastRadiusActive,
    focusedFilePath,
  } = useVizStore();

  const architectureRequestKeyRef = useRef<string | null>(null);
  const architectureRequestSeqRef = useRef(0);
  const [architectureData, setArchitectureData] = useState<AIArchitectureResponse | null>(null);
  const [architectureLoading, setArchitectureLoading] = useState(false);
  const { owner, repo } = analysis.meta;

  const selectedNode = selectedNodeId
    ? analysis.graph.nodes.find((n) => n.id === selectedNodeId)
    : null;

  const prevSelectedNodeIdRef = useRef<string | null>(null);

  // Auto-switch to Detail tab when a graph node is first selected, but keep Learn tab interactions in place.
  useEffect(() => {
    if (
      selectedNodeId &&
      selectedNodeId !== prevSelectedNodeIdRef.current &&
      sidebarTab !== 'learning' &&
      !useVizStore.getState().compareBranch
    ) {
      setSidebarTab('analysis');
    }
    prevSelectedNodeIdRef.current = selectedNodeId;
  }, [selectedNodeId, sidebarTab, setSidebarTab]);

  // Pre-fetch architecture descriptions on route change
  useEffect(() => {
    if (sidebarTab !== 'analysis' || focusedFilePath) return;

    const requestKey = `${owner}/${repo}`;
    if (architectureRequestKeyRef.current === requestKey) return;

    const requestSeq = architectureRequestSeqRef.current + 1;
    architectureRequestSeqRef.current = requestSeq;
    architectureRequestKeyRef.current = requestKey;
    setArchitectureData(null);
    setArchitectureLoading(true);

    void aiArchitecture(owner, repo)
      .then((data) => {
        if (architectureRequestSeqRef.current !== requestSeq) return;
        setArchitectureData(data);
      })
      .catch(() => {
        if (architectureRequestSeqRef.current !== requestSeq) return;
        architectureRequestKeyRef.current = null;
      })
      .finally(() => {
        if (architectureRequestSeqRef.current !== requestSeq) return;
        setArchitectureLoading(false);
      });
  }, [
    sidebarTab,
    owner,
    repo,
    focusedFilePath,
  ]);

  const blastRadiusIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    return getBlastRadiusNodeIds(selectedNode.id, analysis.graph.nodes, analysis.graph.edges);
  }, [selectedNode, analysis]);

  if (!aiSidebarOpen) {
    return (
      <div className="flex h-full w-10 shrink-0 flex-col items-center border-l border-white/[0.06] bg-zinc-950 py-2 select-none">
        <Tooltip>
          <TooltipTrigger
            type="button"
            onClick={() => setAiSidebarOpen(true)}
            className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-350 transition-colors outline-none cursor-pointer"
          >
            <PanelRightOpen className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent side="left">Show sidebar panel</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <aside
      style={style}
      className="flex h-full w-full shrink-0 flex-col border-l border-white/[0.04] bg-[#09080d] shadow-2xl relative select-none"
    >
      {/* 1. Header with spark icon & collapse triggers */}
      <SidebarHeader onClose={() => setAiSidebarOpen(false)} />

      {/* 2. Navigation Tabs Container */}
      <div className="px-4 pt-3.5 pb-2 bg-zinc-950/20 shrink-0">
        <TabNavigation activeTab={sidebarTab} setActiveTab={setSidebarTab} />
      </div>

      {/* 3. Main content body - The ONLY scroll container in the sidebar */}
      <div className="flex-1 overflow-y-auto p-4 text-sm scrollbar-thin">
        <AnimatePresence mode="wait">
          {/* TAB 1: OVERVIEW */}
          {sidebarTab === 'overview' && (
            <TabPanel key="overview">
              <OverviewTab 
                analysis={analysis}
                selectedBranch={selectedBranch}
                graphDiff={graphDiff}
              />
            </TabPanel>
          )}

          {/* TAB 2: MAP */}
          {sidebarTab === 'analysis' && (
            <TabPanel key="analysis">
              <AnalysisTab 
                analysis={analysis}
                selectedNodeId={selectedNodeId}
                setSelectedNodeId={setSelectedNodeId}
                blastRadiusActive={blastRadiusActive}
                blastRadiusIds={blastRadiusIds}
                architecture={architectureData}
                architectureLoading={architectureLoading}
              />
            </TabPanel>
          )}

          {/* TAB 3: AI CENTER */}
          {sidebarTab === 'ai' && (
            <TabPanel key="ai">
              <AiCenterTab analysis={analysis} />
            </TabPanel>
          )}

          {/* TAB 4: TOOLS / LEARNING PATH */}
          {sidebarTab === 'learning' && (
            <TabPanel key="learning">
              <LearningPathTab analysis={analysis} />
            </TabPanel>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Main content flows directly to the end of the sidebar */}
    </aside>
  );
}

function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}
