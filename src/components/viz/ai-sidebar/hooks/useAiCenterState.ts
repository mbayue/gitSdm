import { useEffect, useState, useRef } from 'react';
import { useVizStore } from '@/stores/vizStore';
import {
  useHealth, useRefactor, useRoast, useReadmeEnhance
} from '@/features/ai/useAiTasks';
import { aiExplain, aiExplainLif } from '@/lib/apiClient';
import type {
  AIHealthResponse,
  AIReadmeEnhanceResponse,
  AIRefactorResponse,
  AIRoastResponse,
  RepoAnalysis,
} from '@/types';

// Persistent layout states & caches across tab remounts
export const explanationCache = new Map<string, string>();
export const pendingExplanationRequests = new Map<string, Promise<string>>();
export const pendingToolRequests = new Set<string>();
export const healthCache = new Map<string, AIHealthResponse>();
export const refactorCache = new Map<string, AIRefactorResponse>();
export const roastCache = new Map<string, AIRoastResponse>();
export const readmeEnhanceCache = new Map<string, AIReadmeEnhanceResponse>();

let persistedEli5Mode = false;
let persistedActivePlayground: 'roast' | 'readme' = 'roast';
let persistedAiSubTab: 'explain' | 'health' | 'playground' = 'explain';
let persistedHealthSubMode: 'audit' | 'risks' = 'audit';

export function useAiCenterState(analysis: RepoAnalysis) {
  const {
    sidebarTab,
    selectedNodeId,
    selectedBranch,
  } = useVizStore();

  const [eli5Mode, setEli5Mode] = useState(persistedEli5Mode);
  const [activePlayground, setActivePlaygroundState] = useState<'roast' | 'readme'>(persistedActivePlayground);
  const [aiSubTab, setAiSubTabState] = useState<'explain' | 'health' | 'playground'>(persistedAiSubTab);
  const [healthSubMode, setHealthSubModeState] = useState<'audit' | 'risks'>(persistedHealthSubMode);
  const [cachedExplanation, setCachedExplanation] = useState<string | null>(null);
  const [loadingExplanationKey, setLoadingExplanationKey] = useState<string | null>(null);
  const [readmeCopied, setReadmeCopied] = useState(false);
  const lastExplanationKeyRef = useRef<string | null>(null);

  const setActivePlayground = (mode: 'roast' | 'readme') => {
    persistedActivePlayground = mode;
    setActivePlaygroundState(mode);
  };

  const setAiSubTab = (tab: 'explain' | 'health' | 'playground') => {
    persistedAiSubTab = tab;
    setAiSubTabState(tab);
  };

  const setHealthSubMode = (mode: 'audit' | 'risks') => {
    persistedHealthSubMode = mode;
    setHealthSubModeState(mode);
  };

  const health = useHealth();
  const refactor = useRefactor();
  const roast = useRoast();
  const readmeEnhance = useReadmeEnhance();

  const currentExplanationKey = `${analysis.meta.owner}/${analysis.meta.repo}/${selectedNodeId ?? 'repo'}/${eli5Mode ? 'eli5' : 'normal'}/${selectedBranch ?? 'default'}`;
  const currentExplanation = explanationCache.get(currentExplanationKey) ?? cachedExplanation;
  const isExplainLoading = !currentExplanation && loadingExplanationKey === currentExplanationKey;

  const { owner, repo } = analysis.meta;
  const branchKey = selectedBranch ?? 'default';
  const healthKey = `health:${owner}/${repo}/${branchKey}`;
  const refactorKey = `refactor:${owner}/${repo}/${branchKey}`;
  const roastKey = `roast:${owner}/${repo}/${branchKey}`;
  const readmeEnhanceKey = `readme-enhance:${owner}/${repo}/${branchKey}`;

  const healthData = health.data ?? healthCache.get(healthKey);
  const refactorData = refactor.data ?? refactorCache.get(refactorKey);
  const roastData = roast.data ?? roastCache.get(roastKey);
  const readmeEnhanceData = readmeEnhance.data ?? readmeEnhanceCache.get(readmeEnhanceKey);

  const selectedNode = selectedNodeId
    ? analysis.graph.nodes.find((n) => n.id === selectedNodeId)
    : null;

  // Trigger standard explain when AI tab or node changes
  useEffect(() => {
    if (sidebarTab !== 'ai' || aiSubTab !== 'explain') return;

    const currentKey = currentExplanationKey;

    if (lastExplanationKeyRef.current !== currentKey) {
      const cached = explanationCache.get(currentKey);
      setCachedExplanation(cached ?? null);
      if (cached) {
        lastExplanationKeyRef.current = currentKey;
        return;
      }

      lastExplanationKeyRef.current = currentKey;
      setLoadingExplanationKey(currentKey);

      const loadExplanation = async () => {
        try {
          let request = pendingExplanationRequests.get(currentKey);
          if (!request) {
            request = (!selectedNodeId && eli5Mode
              ? aiExplainLif(owner, repo)
              : aiExplain({
                  owner,
                  repo,
                  scope: selectedNodeId ? 'node' : 'repo',
                  nodeId: selectedNodeId ?? undefined,
                  branch: selectedBranch || undefined,
                  eli5: eli5Mode,
                })
            ).then((data) => data.explanation);
            pendingExplanationRequests.set(currentKey, request);
          }

          const explanation = await request;
          explanationCache.set(currentKey, explanation);
          setCachedExplanation(explanation);
        } finally {
          pendingExplanationRequests.delete(currentKey);
          setLoadingExplanationKey((key) => key === currentKey ? null : key);
        }
      };

      void loadExplanation();
    }
  }, [sidebarTab, aiSubTab, owner, repo, selectedNodeId, eli5Mode, selectedBranch, currentExplanationKey]);

  // Trigger selected health module only
  useEffect(() => {
    if (sidebarTab !== 'ai' || aiSubTab !== 'health') return;

    if (healthSubMode === 'audit' && !healthData && !health.isPending && !pendingToolRequests.has(healthKey)) {
      pendingToolRequests.add(healthKey);
      health.mutate({ owner, repo, branch: selectedBranch || undefined }, {
        onSuccess: (data) => healthCache.set(healthKey, data),
        onSettled: () => pendingToolRequests.delete(healthKey),
      });
    }

    if (healthSubMode === 'risks' && !refactorData && !refactor.isPending && !pendingToolRequests.has(refactorKey)) {
      pendingToolRequests.add(refactorKey);
      refactor.mutate({ owner, repo, branch: selectedBranch || undefined }, {
        onSuccess: (data) => refactorCache.set(refactorKey, data),
        onSettled: () => pendingToolRequests.delete(refactorKey),
      });
    }
  }, [sidebarTab, aiSubTab, healthSubMode, owner, repo, selectedBranch, health, refactor, healthKey, refactorKey, healthData, refactorData]);

  // Trigger playground modules
  useEffect(() => {
    if (sidebarTab === 'ai' && aiSubTab === 'playground') {
      if (activePlayground === 'roast' && !roastData && !roast.isPending && !pendingToolRequests.has(roastKey)) {
        pendingToolRequests.add(roastKey);
        roast.mutate({ owner, repo, branch: selectedBranch || undefined }, {
          onSuccess: (data) => roastCache.set(roastKey, data),
          onSettled: () => pendingToolRequests.delete(roastKey),
        });
      } else if (activePlayground === 'readme' && !readmeEnhanceData && !readmeEnhance.isPending && !pendingToolRequests.has(readmeEnhanceKey)) {
        pendingToolRequests.add(readmeEnhanceKey);
        readmeEnhance.mutate({ owner, repo, branch: selectedBranch || undefined }, {
          onSuccess: (data) => readmeEnhanceCache.set(readmeEnhanceKey, data),
          onSettled: () => pendingToolRequests.delete(readmeEnhanceKey),
        });
      }
    }
  }, [sidebarTab, aiSubTab, activePlayground, owner, repo, selectedBranch, roast, readmeEnhance, roastKey, readmeEnhanceKey, roastData, readmeEnhanceData]);

  // Resolve headers dynamically for IntelligenceCard
  const cardTitle = aiSubTab === 'health' 
    ? 'Diagnostics'
    : aiSubTab === 'playground'
    ? 'Playground'
    : 'Intelligence';

  const cardSubtitle = aiSubTab === 'health' 
    ? (healthSubMode === 'audit' ? 'System Health Audit' : 'Critical Risk Analysis') 
    : aiSubTab === 'playground'
    ? (activePlayground === 'roast' ? 'Project Roaster' : 'Documentation Enhancer')
    : (selectedNode ? selectedNode.data.label : 'Architectural Overview');

  const cardLoading = 
    (aiSubTab === 'explain' && isExplainLoading) ||
    (aiSubTab === 'health' && healthSubMode === 'audit' && health.isPending && !healthData) ||
    (aiSubTab === 'health' && healthSubMode === 'risks' && refactor.isPending && !refactorData) ||
    (aiSubTab === 'playground' && activePlayground === 'roast' && roast.isPending && !roastData) ||
    (aiSubTab === 'playground' && activePlayground === 'readme' && readmeEnhance.isPending && !readmeEnhanceData);

  const toggleEli5Mode = () => {
    const nextEli5Mode = !eli5Mode;
    persistedEli5Mode = nextEli5Mode;
    setEli5Mode(nextEli5Mode);
  };

  return {
    owner,
    repo,
    selectedBranch,
    eli5Mode,
    toggleEli5Mode,
    activePlayground,
    setActivePlayground,
    aiSubTab,
    setAiSubTab,
    healthSubMode,
    setHealthSubMode,
    currentExplanation,
    cardTitle,
    cardSubtitle,
    cardLoading,
    readmeCopied,
    setReadmeCopied,
    healthData,
    refactorData,
    roastData,
    readmeEnhanceData,
    selectedNode,
    health,
    refactor,
    roast,
    readmeEnhance,
    healthKey,
    refactorKey,
    roastKey,
    readmeEnhanceKey,
    pendingToolRequests,
  };
}
