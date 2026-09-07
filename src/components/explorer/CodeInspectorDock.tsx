import { TooltipHint } from '@/components/ui/tooltip';
import React, { useState, useMemo } from 'react';
import { X, Maximize2, Minimize2, Copy, Check, FileCode2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchRepoFile } from '@/lib/apiClient';
import { HighlightedCode, CodePlaceholder } from '@/components/ui/SyntaxHighlighter';
import { useVizStore } from '@/stores/vizStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { copyToClipboard } from '@/lib/clipboard';
import type { GraphData } from '@/types';
import { getFileContext } from '@/lib/file-context';

interface CodeInspectorDockProps {
  state: 'peek' | 'expanded';
  setState: (state: 'closed' | 'peek' | 'expanded') => void;
  filePath: string;
  owner: string;
  repo: string;
  graph: GraphData;
  onSelectFile: (path: string) => void;
}

export function CodeInspectorDock({ state, setState, filePath, owner, repo, graph, onSelectFile }: CodeInspectorDockProps) {
  const selectedBranch = useVizStore((s) => s.selectedBranch);
  const setToastMessage = useVizStore((s) => s.setToastMessage);

  const [copied, setCopied] = useState(false);
  const [dragHeight, setDragHeight] = useState(250);

  // Fetch file content
  const { data, isLoading, error } = useQuery({
    queryKey: ['file', owner, repo, selectedBranch, filePath],
    queryFn: () => fetchRepoFile(owner, repo, filePath, selectedBranch || undefined),
    enabled: !!filePath && !filePath.startsWith('repo:'),
    staleTime: 1000 * 60 * 10,
  });

  const fileName = filePath.split('/').pop() ?? '';
  const context = useMemo(() => getFileContext(graph, filePath), [graph, filePath]);

  // Slice content in peek mode for better performance
  const displayContent = useMemo(() => {
    if (!data?.content) return '';
    if (state === 'peek') {
      return data.content.split('\n').slice(0, 25).join('\n');
    }
    return data.content;
  }, [data?.content, state]);

  // Copy code action
  const handleCopyCode = async () => {
    try {
      await copyToClipboard(data?.content ?? displayContent);
      setCopied(true);
      setToastMessage('Copied code to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setToastMessage('Failed to copy code: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Resize handler for expanded mode
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = dragHeight;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      setDragHeight(Math.max(200, Math.min(window.innerHeight * 0.5, startHeight + deltaY)));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const actualHeight = state === 'peek' ? 190 : dragHeight;

  return (
    <div
      role="region"
      aria-label="File inspector"
      style={{ height: actualHeight, maxHeight: '50%' }}
      className="relative z-40 shrink-0 border-t border-border bg-background flex flex-col min-w-0 transition-[height] duration-200 ease-out"
    >
      {/* Top resize handle & drag affordance */}
      {state === 'expanded' && (
        <div
          onMouseDown={handleMouseDown}
          className="group absolute top-0 left-0 right-0 h-1.5 cursor-row-resize bg-transparent hover:bg-ui-active/20 transition-all z-[80] flex items-center justify-center"
        >
          {/* Subtle drag indicator */}
          <div className="w-8 h-0.5 rounded-full bg-secondary group-hover:bg-ui-active/50 transition-colors" />
        </div>
      )}

      {/* Panel Header */}
      <header className="flex h-11 shrink-0 items-center justify-between px-4 border-b border-border bg-card">
        {/* Left Side: Title & File info with better hierarchy */}
        <div className="flex flex-col justify-center min-w-0 py-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <FileCode2 className="h-3.5 w-3.5 text-ui-active-text-green shrink-0" />
            <span className="text-foreground font-semibold text-xs truncate max-w-[200px] sm:max-w-[320px]">
              {fileName}
            </span>
          </div>
          <span className="text-muted-foreground font-normal font-mono text-xs truncate max-w-[320px] sm:max-w-[500px] leading-tight">
            {filePath}
          </span>
        </div>

        {/* Right Side: Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Copy code button */}
          <Tooltip>
            <TooltipTrigger
              type="button"
              aria-label="Copy file code"
              disabled={!data || isLoading || !!error}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              onClick={handleCopyCode}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            </TooltipTrigger>
            <TooltipContent side="top">Copy Code</TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-secondary mx-1" />

          {/* Toggle Expand/Collapse button */}
          <Tooltip>
            <TooltipTrigger
              type="button"
              aria-label={state === 'peek' ? 'Expand file inspector' : 'Collapse file inspector'}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              onClick={() => setState(state === 'peek' ? 'expanded' : 'peek')}
            >
              {state === 'peek' ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
            </TooltipTrigger>
            <TooltipContent side="top">{state === 'peek' ? 'Open Full' : 'Collapse'}</TooltipContent>
          </Tooltip>

          {/* Close button */}
          <Tooltip>
            <TooltipTrigger
              type="button"
              aria-label="Close file inspector"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-destructive transition-colors"
              onClick={() => setState('closed')}
            >
              <X className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top">Close Inspector</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <details className="shrink-0 max-h-[45%] overflow-auto border-b border-border bg-card px-4 py-2 text-xs">
        <summary className="cursor-pointer text-foreground">
          {context.role} · {context.dependencies.length} {context.dependencies.length === 1 ? 'dependency' : 'dependencies'} · {context.dependents.length} {context.dependents.length === 1 ? 'dependent' : 'dependents'}
        </summary>
        <div className="grid gap-3 py-3 sm:grid-cols-2">
          {([{ title: 'Dependencies', nodes: context.dependencies }, { title: 'Used by', nodes: context.dependents }]).map((group) => (
            <div key={group.title}>
              <h3 className="mb-1 font-semibold">{group.title}</h3>
              {group.nodes.length ? group.nodes.map((node) => node.type === 'file' && node.data.path ? (
                <TooltipHint key={node.id} content={node.data.path}><button aria-label={node.data.path} type="button" onClick={() => onSelectFile(node.data.path!)}
                  className="block w-full truncate rounded py-1 text-left text-accent hover:underline">{node.data.path}</button></TooltipHint>
              ) : <p key={node.id} className="py-1 text-muted-foreground">{node.data.label}</p>) : <p className="text-muted-foreground">None found in this analysis.</p>}
            </div>
          ))}
        </div>
      </details>

      {/* Code Container */}
      <div className="flex-1 min-h-0 overflow-auto bg-background p-2 relative font-mono">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            <span className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent mr-2" />
            Loading file contents...
          </div>
        )}
        {error && (
          <CodePlaceholder
            message={
              error instanceof Error && error.message.includes('not a regular file')
                ? 'This selection is a folder or repository root, not a previewable source file.'
                : error instanceof Error
                ? error.message
                : 'Failed to load file contents'
            }
          />
        )}
        {!isLoading && !error && data && (
          <HighlightedCode content={displayContent} path={data.path} activeLine={1} />
        )}

        {/* Bottom fade mask in peek mode */}
        {state === 'peek' && !isLoading && !error && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}
