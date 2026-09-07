import { useState, useMemo } from 'react';
import { useLearningPath } from '@/features/ai/useAiTasks';
import { useVizStore } from '@/stores/vizStore';
import type { RepoAnalysis } from '@/types';
import {
  RefreshCw, ShieldAlert, Sparkles, Brain, FileText, Target
} from 'lucide-react';
import { motion } from 'framer-motion';

import { AIErrorCard } from './AIErrorCard';

// Decoupled subcomponents

export function LearningPathTab({ analysis }: { analysis: RepoAnalysis }) {
  const { owner, repo } = analysis.meta;
  const selectedBranch = useVizStore((s) => s.selectedBranch);
  const activeFocusLayer = useVizStore((s) => s.activeFocusLayer);
  const selectedNodeId = useVizStore((s) => s.selectedNodeId);
  const triggerGraphAction = useVizStore((s) => s.triggerGraphAction);

  const [showAllPaths, setShowAllPaths] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [submittedGoal, setSubmittedGoal] = useState('');

  const lp = useLearningPath(owner, repo, selectedBranch, true, submittedGoal || undefined);

  const data = lp.data;

  const nodeById = useMemo(() => {
    const map = new Map<string, string>();
    analysis.graph.nodes.forEach(n => {
      map.set(n.id, n.id);
      if (n.data.path) map.set(n.data.path, n.id);
    });
    return map;
  }, [analysis.graph.nodes]);

  const selectPath = (path: string, explain = false) => {
    useVizStore.setState({
      selectedNodeId: nodeById.get(path) ?? null,
      focusedFilePath: path,
      ...(explain ? { sidebarTab: 'ai' as const } : {}),
    });
    triggerGraphAction('focusGraph');
  };

  const handleRefresh = () => {
    lp.refetch();
  };

  if (lp.isPending) {
    return (
      <div className="flex flex-col gap-5 p-4">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-secondary animate-pulse" />
          <div className="h-20 w-full rounded-xl bg-secondary animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-36 rounded bg-secondary animate-pulse" />
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex gap-3 items-center">
              <div className="h-10 w-10 rounded-full bg-secondary animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-2/3 rounded bg-secondary animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-secondary animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (lp.isError) {
    return (
      <div className="p-4">
        <AIErrorCard
          title="Failed to build learning path"
          message={lp.error instanceof Error ? lp.error.message : String(lp.error)}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="h-10 w-10 text-red-500/80 mb-3" />
        <h4 className="text-sm font-medium text-foreground mb-1">No learning path data available</h4>
        <p className="text-xs text-muted-foreground max-w-[240px] mb-4">
          Try clicking retry to generate onboarding paths for this repository.
        </p>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Generate Path
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 select-none pb-8">
      {/* Personalized Goal Input */}
      <div className="rounded-md border border-border bg-background p-3 space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Target className="h-3 w-3 text-accent" />
          Learning Goal
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            aria-label="Learning goal"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setSubmittedGoal(goalInput.trim()); }}
            placeholder="e.g. understand auth flow, fix search bugs..."
            className="flex-1 min-w-0 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/40 transition-colors"
          />
          <button
            onClick={() => setSubmittedGoal(goalInput.trim())}
            disabled={!goalInput.trim()}
            className="shrink-0 rounded-md bg-accent/10 border border-accent/30 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Start Tour
          </button>
        </div>
        {submittedGoal && (
          <div className="flex items-center gap-1.5 text-xs text-accent">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span className="truncate">Customizing path for: <strong className="text-foreground">{submittedGoal}</strong></span>
            <button
              onClick={() => { setSubmittedGoal(''); setGoalInput(''); }}
              className="ml-auto shrink-0 text-muted-foreground hover:text-foreground underline"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Recommended Learning Path */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Guided Codebase Tour
          </h4>
          <span className="text-xs text-ui-active-text-green font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {data.recommendedPath ? `Learning path · ${data.recommendedPath.length} steps` : 'Step-by-Step'}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mb-4 italic border-l-2 border-accent/30 pl-2">
          {activeFocusLayer === 'api' ? 'API / Routes focus' :
           activeFocusLayer === 'ui' ? 'UI / Components focus' :
           activeFocusLayer === 'core' ? 'Core Services focus' :
           activeFocusLayer === 'config' ? 'Configuration focus' :
           'Full architecture focus'} — showing roadmap files and related dependencies.
        </p>

        <div className="space-y-2.5">
          {(showAllPaths ? data.recommendedPath : data.recommendedPath?.slice(0, 5))?.map((item, idx) => {
            const isActive = selectedNodeId === item.path || selectedNodeId === `file:${item.path}` || selectedNodeId === `folder:${item.path}`;
            return (
            <motion.div
                key={item.path}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                role="group"
                aria-label={`Learning step ${idx + 1}: ${item.path}`}
              className={`group flex gap-3 items-start rounded-md border p-3 transition-all duration-200 ${
                isActive
                  ? 'border-accent/50 bg-accent/10 shadow-[0_0_10px_rgba(88,166,255,0.1)]'
                  : 'border-border bg-background hover:bg-card hover:border-ring/50'
              }`}
            >
              {/* Index & score circle */}
              <div className={`shrink-0 flex items-center justify-center h-6 w-6 rounded-md border text-xs font-mono transition-colors mt-0.5 ${
                isActive
                  ? 'bg-accent/20 border-accent/50 text-foreground'
                  : 'bg-card border-border text-muted-foreground group-hover:border-accent/40 group-hover:text-foreground'
              }`}>
                {idx + 1}
              </div>

              {/* Path and details */}
              <div className="flex-1 min-w-0 text-left">
                <button type="button" onClick={() => selectPath(item.path)} aria-label={`Inspect ${item.path}`} aria-pressed={isActive} className="block w-full rounded text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate block">
                      {item.path.split('/').pop()}
                    </span>
                    <span className="text-xs block text-muted-foreground font-mono truncate mt-0.5">
                      {item.path}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-card border border-border text-ui-active-text-green font-mono">
                    {item.role}
                  </span>
                </span>

                <span className="text-xs block text-muted-foreground mt-2 leading-relaxed font-sans">
                  {item.reason}
                </span>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border">
                  <button
                    onClick={() => selectPath(item.path)}
                    className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary px-2 py-1 rounded transition-colors"
                  >
                    <FileText className="h-3 w-3" /> OPEN
                  </button>

                  <button
                    onClick={() => selectPath(item.path, true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary px-2 py-1 rounded transition-colors ml-auto"
                  >
                    <Brain className="h-3 w-3" /> EXPLAIN
                  </button>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>

        {data.recommendedPath && data.recommendedPath.length > 5 && !showAllPaths && (
          <button
            onClick={() => setShowAllPaths(true)}
            className="w-full mt-3 py-2 text-xs font-medium text-accent hover:text-accent hover:bg-accent/10 rounded transition-colors"
          >
            View full roadmap ({data.recommendedPath.length - 5} more)
          </button>
        )}
      </div>
    </div>
  );
}
