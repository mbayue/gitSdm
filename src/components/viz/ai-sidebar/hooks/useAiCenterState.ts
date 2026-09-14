import {
  explanationCache,
  runExplanation,
  healthCache,
  refactorCache,
  roastCache,
  readmeEnhanceCache,
  getToolKey,
} from '@/features/ai/tool-cache';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useChatConfigRevision } from '@/stores/chatConfigStore';
import { useVizStore } from '@/stores/vizStore';
import {
  useHealth, useRefactor, useRoast, useReadmeEnhance
} from '@/features/ai/useAiTasks';
import { aiExplain, aiExplainLif } from '@/lib/apiClient';
import type { RepoAnalysis } from '@/types';

export { explanationCache };

let persistedEli5Mode = false;
let persistedActivePlayground: 'roast' | 'readme' = 'roast';
let persistedAiSubTab: 'explain' | 'health' | 'playground' = 'explain';
let persistedHealthSubMode: 'audit' | 'risks' = 'audit';

export function useAiCenterState(analysis: RepoAnalysis) {
  const { revision } = useChatConfigRevision();
  const {
    sidebarTab,
    selectedNodeId,
    selectedBranch,
  } = useVizStore();

  const [eli5Mode, setEli5Mode] = useState(persistedEli5Mode);
  const [activePlayground, setActivePlaygroundState] = useState<'roast' | 'readme'>(persistedActivePlayground);
  const [aiSubTab, setAiSubTabState] = useState<'explain' | 'health' | 'playground'>(persistedAiSubTab);
  const [healthSubMode, setHealthSubModeState] = useState<'audit' | 'risks'>(persistedHealthSubMode);
  const [cachedExplanation, setCachedExplanation] = useState<{ key: string; value: string } | null>(null);
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

  const [explanationErrors, setExplanationErrors] = useState<Record<string, string | null>>({});
  const [explanationRetry, setExplanationRetry] = useState(0);
  const health = useHealth();
  const refactor = useRefactor();
  const roast = useRoast();
  const readmeEnhance = useReadmeEnhance();

  const currentExplanationKey = `${revision}/${analysis.meta.owner}/${analysis.meta.repo}/${analysis.meta.sha}/${selectedNodeId ?? 'repo'}/${eli5Mode ? 'eli5' : 'normal'}/${selectedBranch ?? 'default'}`;
  const currentExplanation = explanationCache.get(currentExplanationKey) ?? (cachedExplanation?.key === currentExplanationKey ? cachedExplanation.value : null);
  const isExplainLoading = !currentExplanation && loadingExplanationKey === currentExplanationKey;

  const { owner, repo, sha } = analysis.meta;
  // Finished mutations keep their data truthy across config revisions, which
  // would block a fresh request keyed for the new revision — reset on both changes.
  const prevMetaRef = useRef(`${sha}/${revision}`);
  useEffect(() => {
    const metaKey = `${sha}/${revision}`;
    if (prevMetaRef.current === metaKey) return;
    prevMetaRef.current = metaKey;
    health.reset();
    refactor.reset();
    roast.reset();
    readmeEnhance.reset();
  }, [sha, revision, health, refactor, roast, readmeEnhance]);

  const healthData =
    (health.data?.revision === revision ? health.data : undefined) ??
    healthCache.get(getToolKey('health', owner, repo, revision, selectedBranch, sha));
  const refactorData =
    (refactor.data?.revision === revision ? refactor.data : undefined) ??
    refactorCache.get(getToolKey('refactor', owner, repo, revision, selectedBranch, sha));
  const roastData =
    (roast.data?.revision === revision ? roast.data : undefined) ??
    roastCache.get(getToolKey('roast', owner, repo, revision, selectedBranch, sha));
  const readmeEnhanceData =
    (readmeEnhance.data?.revision === revision ? readmeEnhance.data : undefined) ??
    readmeEnhanceCache.get(getToolKey('readme-enhance', owner, repo, revision, selectedBranch, sha));

  const nodeById = useMemo(
    () => new Map(analysis.graph.nodes.map((n) => [n.id, n])),
    [analysis.graph.nodes]
  );

  const selectedNode = selectedNodeId
    ? nodeById.get(selectedNodeId) ?? null
    : null;

  // Trigger standard explain when AI tab or node changes
  useEffect(() => {
    if (sidebarTab !== 'ai' || aiSubTab !== 'explain') return;

    const currentKey = currentExplanationKey;

    if (lastExplanationKeyRef.current !== currentKey) {
      const cached = explanationCache.get(currentKey);
      setCachedExplanation(cached ? { key: currentKey, value: cached } : null);
      if (cached) {
        lastExplanationKeyRef.current = currentKey;
        return;
      }

      lastExplanationKeyRef.current = currentKey;
      setLoadingExplanationKey(currentKey);

      const loadExplanation = async () => {
        try {
          const explanation = await runExplanation(currentKey, () =>
            (!selectedNodeId && eli5Mode
              ? aiExplainLif(owner, repo)
              : aiExplain({
                  owner,
                  repo,
                  scope: selectedNodeId ? 'node' : 'repo',
                  nodeId: selectedNodeId ?? undefined,
                  branch: selectedBranch || undefined,
                  eli5: eli5Mode,
                })
            ).then((data) => data.explanation)
          );

          setCachedExplanation({ key: currentKey, value: explanation });
          setExplanationErrors((errors) => ({ ...errors, [currentKey]: null }));
        } catch {
          setExplanationErrors((errors) => ({ ...errors, [currentKey]: 'AI explanation failed. Please try again.' }));
        } finally {
          setLoadingExplanationKey((key) => key === currentKey ? null : key);
        }
      };

      void loadExplanation();
    }
  }, [sidebarTab, aiSubTab, owner, repo, selectedNodeId, eli5Mode, selectedBranch, currentExplanationKey, explanationRetry]);

  // Trigger selected health module only
  useEffect(() => {
    if (sidebarTab !== 'ai' || aiSubTab !== 'health') return;

    if (healthSubMode === 'audit' && !healthData && !health.isPending && !health.isError) {
      health.mutate({ owner, repo, branch: selectedBranch || undefined, sha });
    }

    if (healthSubMode === 'risks' && !refactorData && !refactor.isPending && !refactor.isError) {
      refactor.mutate({ owner, repo, branch: selectedBranch || undefined, sha });
    }
  }, [sidebarTab, aiSubTab, healthSubMode, owner, repo, selectedBranch, health, refactor, healthData, refactorData, sha]);

  // Trigger playground modules
  useEffect(() => {
    if (sidebarTab === 'ai' && aiSubTab === 'playground') {
      if (activePlayground === 'roast' && !roastData && !roast.isPending && !roast.isError) {
        roast.mutate({ owner, repo, branch: selectedBranch || undefined, sha });
      } else if (activePlayground === 'readme' && !readmeEnhanceData && !readmeEnhance.isPending && !readmeEnhance.isError) {
        readmeEnhance.mutate({ owner, repo, branch: selectedBranch || undefined, sha });
      }
    }
  }, [sidebarTab, aiSubTab, activePlayground, owner, repo, selectedBranch, roast, readmeEnhance, roastData, readmeEnhanceData, sha]);

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

  const activeMutation = aiSubTab === 'health'
    ? (healthSubMode === 'audit' ? health : refactor)
    : aiSubTab === 'playground' ? (activePlayground === 'roast' ? roast : readmeEnhance) : null;
  const activeData = aiSubTab === 'health'
    ? (healthSubMode === 'audit' ? healthData : refactorData)
    : aiSubTab === 'playground' ? (activePlayground === 'roast' ? roastData : readmeEnhanceData) : null;
  const cardLoading = aiSubTab === 'explain' ? isExplainLoading : Boolean(activeMutation?.isPending && !activeData);

  const cardError = aiSubTab === 'explain'
    ? explanationErrors[currentExplanationKey] ?? null
    : activeMutation?.isError ? 'AI request failed. Check your settings and try again.' : null;
  const retryCard = () => {
    if (aiSubTab === 'explain') {
      lastExplanationKeyRef.current = '';
      setExplanationErrors((errors) => ({ ...errors, [currentExplanationKey]: null }));
      setExplanationRetry(value => value + 1);
    } else activeMutation?.reset();
  };

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
    cardError,
    retryCard,
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
  };
}
