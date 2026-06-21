import React, { useState, useMemo } from 'react';
import { X, Maximize2, Minimize2, Copy, Check, FileCode2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchRepoFile } from '@/lib/apiClient';
import { HighlightedCode, CodePlaceholder } from '@/components/ui/SyntaxHighlighter';
import { useVizStore } from '@/stores/vizStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CodeInspectorDockProps {
  state: 'peek' | 'expanded';
  setState: (state: 'closed' | 'peek' | 'expanded') => void;
  filePath: string;
  owner: string;
  repo: string;
}

export function CodeInspectorDock({ state, setState, filePath, owner, repo }: CodeInspectorDockProps) {
  const selectedBranch = useVizStore((s) => s.selectedBranch);
  const setToastMessage = useVizStore((s) => s.setToastMessage);

  const [copied, setCopied] = useState(false);
  const [dragHeight, setDragHeight] = useState(250);

  // Fetch file content
  const { data, isLoading, error } = useQuery({
    queryKey: ['file', owner, repo, selectedBranch, filePath],
    queryFn: () => fetchRepoFile(owner, repo, filePath, selectedBranch || undefined),
    enabled: !!filePath,
    staleTime: 1000 * 60 * 10,
  });

  const fileName = filePath.split('/').pop() ?? '';

  // Slice content in peek mode for better performance
  const displayContent = useMemo(() => {
    if (!data?.content) return '';
    if (state === 'peek') {
      return data.content.split('\n').slice(0, 25).join('\n');
    }
    return data.content;
  }, [data?.content, state]);

  // Copy Path action
  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(filePath);
      setCopied(true);
      setToastMessage('Copied path to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy path: ', err);
    }
  };

  // Resize handler for expanded mode
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = dragHeight;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      setDragHeight(Math.max(200, Math.min(window.innerHeight * 0.35, startHeight + deltaY)));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const actualHeight = state === 'peek' ? 140 : dragHeight;

  return (
    <div
      style={{ height: actualHeight }}
      className="relative shrink-0 border-t border-white/[0.06] bg-zinc-950/95 backdrop-blur-md shadow-2xl flex flex-col min-w-0 transition-[height] duration-200 ease-out select-none"
    >
      {/* Top resize handle & drag affordance */}
      {state === 'expanded' && (
        <div
          onMouseDown={handleMouseDown}
          className="group absolute top-0 left-0 right-0 h-1.5 cursor-row-resize bg-transparent hover:bg-ui-active/20 transition-all z-[80] flex items-center justify-center"
        >
          {/* Subtle drag indicator */}
          <div className="w-8 h-0.5 rounded-full bg-white/[0.1] group-hover:bg-ui-active/50 transition-colors" />
        </div>
      )}

      {/* Panel Header */}
      <header className="flex h-11 shrink-0 items-center justify-between px-4 border-b border-white/[0.04] bg-zinc-900/40">
        {/* Left Side: Title & File info with better hierarchy */}
        <div className="flex flex-col justify-center min-w-0 py-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <FileCode2 className="h-3.5 w-3.5 text-ui-active-text-green shrink-0" />
            <span className="text-zinc-150 font-semibold text-xs truncate max-w-[200px] sm:max-w-[320px]">
              {fileName}
            </span>
          </div>
          <span className="text-zinc-500 font-normal font-mono text-[9px] truncate max-w-[320px] sm:max-w-[500px] leading-tight">
            {filePath}
          </span>
        </div>

        {/* Right Side: Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Copy path button */}
          <Tooltip>
            <TooltipTrigger
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
              onClick={handleCopyPath}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            </TooltipTrigger>
            <TooltipContent side="top">Copy Path</TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-white/[0.08] mx-1" />

          {/* Toggle Expand/Collapse button */}
          <Tooltip>
            <TooltipTrigger
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
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
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              onClick={() => setState('closed')}
            >
              <X className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top">Close Inspector</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Code Container */}
      <div className="flex-1 min-h-0 overflow-auto bg-zinc-950/60 p-2 relative font-mono">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
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
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}
