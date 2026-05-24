import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVizStore, type SidebarTab } from '@/stores/viz-store';
import { useExplain } from '@/features/ai/useAI';
import type { RepoAnalysis } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

const tabs: { id: SidebarTab; label: string; icon: typeof Brain }[] = [
  { id: 'explain', label: 'Explain', icon: Brain },
  { id: 'dependencies', label: 'Dependencies', icon: Package },
];

interface AISidebarProps {
  analysis: RepoAnalysis;
}

export function AISidebar({ analysis }: AISidebarProps) {
  const {
    sidebarTab,
    setSidebarTab,
    selectedNodeId,
    setSelectedNodeId,
  } = useVizStore();
  const explain = useExplain();

  const { owner, repo } = analysis.meta;

  const selectedNode = selectedNodeId
    ? analysis.graph.nodes.find((n) => n.id === selectedNodeId)
    : null;

  useEffect(() => {
    if (sidebarTab === 'explain' && !explain.data && !explain.isPending) {
      explain.mutate({
        owner,
        repo,
        scope: selectedNodeId ? 'node' : 'repo',
        nodeId: selectedNodeId ?? undefined,
      });
    }
  }, [sidebarTab, owner, repo, selectedNodeId]);


  const handleTab = (tab: SidebarTab) => {
    setSidebarTab(tab);
    if (tab === 'explain') {
      explain.mutate({
        owner,
        repo,
        scope: selectedNodeId ? 'node' : 'repo',
        nodeId: selectedNodeId ?? undefined,
      });
    }
  };

  const isExplainLoading = explain.isPending;

  return (
    <aside className="flex h-full w-full flex-col border-l border-white/5 bg-zinc-950/60">
      <div className="flex border-b border-white/5 bg-zinc-950/40 p-1.5 gap-1 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTab(t.id)}
            disabled={t.id === 'explain' && isExplainLoading}
            className={cn(
              'ai-sidebar-tab flex flex-1 items-center justify-center gap-1.5 py-2 px-1 rounded-md text-[10px] font-medium transition-all duration-200',
              t.id === 'explain' && isExplainLoading ? 'cursor-wait opacity-90' : '',
              sidebarTab === t.id
                ? 'ai-sidebar-tab-active bg-violet-600/15 text-violet-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-violet-500/20'
                : 'ai-sidebar-tab-inactive text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent',
            )}
          >
            <t.icon className={cn("h-3.5 w-3.5 transition-transform duration-200", sidebarTab === t.id ? "scale-105 text-violet-400" : "")} />
            <span className="truncate">{t.label}</span>
            {t.id === 'explain' && isExplainLoading ? (
              <span className="flex items-center gap-1 text-[10px] text-violet-200">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-t-transparent border-violet-200 animate-spin" />
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-sm">
        <AnimatePresence mode="wait">
          {sidebarTab === 'explain' && (
            <TabPanel key="explain">
              {selectedNode ? (
                <div className="mb-4 rounded-lg border border-white/5 bg-zinc-900/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                      {selectedNode.type}
                    </span>
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      Reset Overview
                    </button>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-white truncate" title={selectedNode.data.path || selectedNode.data.label}>
                    {selectedNode.data.label}
                  </h3>
                  {selectedNode.data.path && (
                    <code className="mt-1 block text-[10px] text-cyan-400/80 truncate">
                      {selectedNode.data.path}
                    </code>
                  )}
                </div>
              ) : (
                <div className="mb-4 rounded-lg border border-white/5 bg-zinc-900/30 p-3">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    Repository Overview
                  </span>
                  <h3 className="mt-2 text-sm font-semibold text-white">
                    {analysis.meta.fullName}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                    {analysis.meta.description || 'No description provided.'}
                  </p>
                </div>
              )}

              {explain.isPending ? (
                <div className="space-y-4">
                  <div className="ai-explain-loading rounded-lg border border-violet-500/20 bg-violet-500/10 p-3 text-[11px] uppercase tracking-[0.24em] text-violet-200">
                    <div className="flex items-center gap-2">
                      <span className="ai-explain-loading-spinner h-2.5 w-2.5 rounded-full border-2 border-t-transparent border-violet-200 animate-spin" />
                      Generating AI explanation...
                    </div>
                  </div>
                  <LoadingBlocks />
                </div>
              ) : (
                <Markdownish text={explain.data?.explanation ?? ''} />
              )}
            </TabPanel>
          )}
          {sidebarTab === 'dependencies' && (
            <TabPanel key="dependencies">
              <div className="space-y-3">
                {analysis.dependencies.length ? (
                  <ul className="space-y-2">
                    {analysis.dependencies.map((dep) => (
                      <li key={`${dep.name}:${dep.version ?? ''}`}>
                        <div className="glass rounded-lg border border-white/5 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-medium text-white text-sm">{dep.name}</div>
                              <div className="mt-1 text-xs text-zinc-500">
                                {dep.ecosystem}{dep.version ? ` · ${dep.version}` : ''}
                              </div>
                            </div>
                            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] uppercase text-zinc-400 border border-zinc-700/50">
                              {dep.type}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-400">No dependency metadata found for this repository.</p>
                )}
              </div>
            </TabPanel>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function LoadingBlocks() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

function Markdownish({ text }: { text: string }) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as {
        steps?: { title: string; description: string; filePath?: string }[];
        overview?: string;
        explanation?: string;
      };
      if (parsed.steps?.length) {
        return (
          <ol className="space-y-3">
            {parsed.steps.map((step, i) => (
              <li key={i} className="rounded-lg border border-white/5 bg-zinc-900/50 p-3">
                <p className="font-medium text-white">{step.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{step.description}</p>
                {step.filePath && (
                  <code className="mt-1 block text-[10px] text-cyan-400/80">{step.filePath}</code>
                )}
              </li>
            ))}
          </ol>
        );
      }
      if (parsed.overview) {
        return <p className="text-sm leading-relaxed text-zinc-300">{parsed.overview}</p>;
      }
      if (parsed.explanation) {
        return <p className="text-sm leading-relaxed text-zinc-300">{parsed.explanation}</p>;
      }
    } catch {
      // fall through to plain text
    }
  }

  // Parse lines to render headers, bullet points, code blocks and plain paragraphs
  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  
  let insideCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (insideCodeBlock) {
        renderedElements.push(
          <pre key={`code-${codeBlockKey++}`} className="my-2 overflow-x-auto rounded bg-zinc-900 p-2 text-xs font-mono text-zinc-300 border border-white/5">
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        insideCodeBlock = false;
      } else {
        insideCodeBlock = true;
      }
      continue;
    }

    if (insideCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    const trimmedLine = line.trim();

    // Headers
    if (trimmedLine.startsWith('# ')) {
      renderedElements.push(
        <h1 key={i} className="mt-4 mb-2 text-lg font-bold text-white">
          {renderInline(trimmedLine.slice(2))}
        </h1>
      );
    } else if (trimmedLine.startsWith('## ')) {
      renderedElements.push(
        <h2 key={i} className="mt-3 mb-2 text-base font-semibold text-white">
          {renderInline(trimmedLine.slice(3))}
        </h2>
      );
    } else if (trimmedLine.startsWith('### ')) {
      renderedElements.push(
        <h3 key={i} className="mt-2.5 mb-1.5 text-sm font-semibold text-white">
          {renderInline(trimmedLine.slice(4))}
        </h3>
      );
    }
    // Bullet items
    else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      renderedElements.push(
        <div key={i} className="ml-4 flex items-start gap-1.5 my-1">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
          <span className="text-sm leading-relaxed text-zinc-300">
            {renderInline(trimmedLine.slice(2))}
          </span>
        </div>
      );
    }
    // Numbered lists
    else if (/^\d+\.\s/.test(trimmedLine)) {
      const match = trimmedLine.match(/^(\d+)\.\s(.*)/);
      if (match) {
        renderedElements.push(
          <div key={i} className="ml-4 flex items-start gap-1.5 my-1">
            <span className="text-xs font-medium text-violet-400 mt-0.5 shrink-0">{match[1]}.</span>
            <span className="text-sm leading-relaxed text-zinc-300">
              {renderInline(match[2])}
            </span>
          </div>
        );
      }
    }
    // Plain line
    else if (trimmedLine !== '') {
      renderedElements.push(
        <p key={i} className="text-sm leading-relaxed text-zinc-300 my-2">
          {renderInline(line)}
        </p>
      );
    }
  }

  return <div className="space-y-1">{renderedElements}</div>;
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="rounded bg-zinc-900 px-1 py-0.5 font-mono text-xs text-violet-300 border border-white/5">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
