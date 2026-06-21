import { useRef } from 'react';
import { RefreshCw, Network, Check, CodeXml, Code, FileImage, FileCode2, ChevronDown, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { RepoAnalysis } from '@/types';
import { useArchitecturePanZoom } from './architecture/hooks/useArchitecturePanZoom';
import { useArchitectureExport } from './architecture/hooks/useArchitectureExport';
import { useArchitectureState } from './architecture/hooks/useArchitectureState';

interface ArchitectureViewProps {
  analysis: RepoAnalysis;
  owner: string;
  repo: string;
  compact?: boolean;
}

export function ArchitectureView({ analysis, owner, repo, compact }: ArchitectureViewProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const {
    zoom,
    setZoom,
    pan,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    resetView,
  } = useArchitecturePanZoom();

  const {
    generate,
    data,
    isPending,
    isError,
    error,
    svg,
    renderError,
    mode,
    setMode,
  } = useArchitectureState(analysis, owner, repo, resetView);

  const {
    copied,
    copiedSvg,
    handleCopyCode,
    handleCopySvg,
    handleDownloadSvg,
    handleDownloadPng,
  } = useArchitectureExport(analysis, repo, mode, data, svgContainerRef);

  return (
    <div className={cn("flex h-full w-full flex-col bg-zinc-950", compact ? "p-2.5" : "p-6")}>
      {/* Header Panel */}
      {!compact ? (
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/5 pb-5 sm:flex-row sm:items-center select-none">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
              <Network className="h-5 w-5 text-zinc-400" />
              Architecture View
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Interactive block diagram mapping the structure of <span className="font-mono text-zinc-300">{owner}/{repo}</span>
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Segmented Mode Selector */}
            <div className="flex items-center rounded-md border border-white/5 bg-zinc-950 p-0.5 mr-2">
              <button
                type="button"
                onClick={() => setMode('code')}
                className={cn(
                  'rounded px-2.5 py-1 text-[10px] font-semibold transition-all duration-150',
                  mode === 'code'
                    ? 'bg-zinc-800 text-zinc-100 shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                Code Graph
              </button>
              <button
                type="button"
                onClick={() => setMode('ai')}
                className={cn(
                  'rounded px-2.5 py-1 text-[10px] font-semibold transition-all duration-150',
                  mode === 'ai'
                    ? 'bg-zinc-800 text-zinc-100 shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                AI Enhanced
              </button>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={!svg}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border h-8 px-3 text-xs font-semibold transition-all outline-none focus:ring-2 focus:ring-[#238636]/30",
                    svg ? "border-[#238636] bg-[#238636] text-white hover:bg-[#2ea043] hover:border-[rgba(240,246,252,0.1)] active:scale-[0.98] shadow-md shadow-[#238636]/20" : "border-zinc-800 bg-zinc-900 text-zinc-500 opacity-50 cursor-not-allowed"
                  )}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#161b22] border-[rgba(240,246,252,0.1)] shadow-xl rounded-md p-1 z-50">
                  <DropdownMenuItem onClick={handleCopySvg} className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded cursor-pointer outline-none">
                    {copiedSvg ? <Check className="h-4 w-4 text-[#3fb950]" /> : <CodeXml className="h-4 w-4 text-zinc-400" />}
                    <span>{copiedSvg ? 'Copied SVG!' : 'Copy SVG'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyCode} className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded cursor-pointer outline-none">
                    {copied ? <Check className="h-4 w-4 text-[#3fb950]" /> : <Code className="h-4 w-4 text-zinc-400" />}
                    <span>{copied ? 'Copied Code!' : 'Copy Mermaid Code'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5 my-1" />
                  <DropdownMenuItem onClick={handleDownloadSvg} className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded cursor-pointer outline-none">
                    <FileCode2 className="h-4 w-4 text-zinc-400" />
                    <span>Download SVG</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadPng} className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-[#3fb950] hover:text-[#56d364] hover:bg-zinc-800/80 rounded cursor-pointer outline-none">
                    <FileImage className="h-4 w-4" />
                    <span>Download PNG</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/5 pb-2.5 select-none">
          {/* Segmented Mode Selector */}
          <div className="flex items-center rounded-md border border-white/5 bg-zinc-950 p-0.5">
            <button
              type="button"
              onClick={() => setMode('code')}
              className={cn(
                'rounded px-2.5 py-0.5 text-[10px] font-semibold transition-all duration-150',
                mode === 'code'
                  ? 'bg-zinc-800 text-zinc-100 shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              Code Graph
            </button>
            <button
              type="button"
              onClick={() => setMode('ai')}
              className={cn(
                'rounded px-2.5 py-0.5 text-[10px] font-semibold transition-all duration-150',
                mode === 'ai'
                  ? 'bg-zinc-800 text-zinc-100 shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              AI Enhanced
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={!svg}
                className="flex items-center justify-center rounded bg-zinc-900 border border-zinc-800 h-6 px-2 text-zinc-400 hover:text-white transition-colors outline-none"
                title="Export Diagram"
              >
                <Download className="h-3.5 w-3.5" />
                <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#161b22] border-[rgba(240,246,252,0.1)] shadow-xl rounded-md p-1 z-50">
                <DropdownMenuItem onClick={handleCopySvg} className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded cursor-pointer outline-none">
                  {copiedSvg ? <Check className="h-4 w-4 text-[#3fb950]" /> : <CodeXml className="h-4 w-4 text-zinc-400" />}
                  <span>{copiedSvg ? 'Copied SVG!' : 'Copy SVG'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyCode} className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded cursor-pointer outline-none">
                  {copied ? <Check className="h-4 w-4 text-[#3fb950]" /> : <Code className="h-4 w-4 text-zinc-400" />}
                  <span>{copied ? 'Copied Code!' : 'Copy Mermaid Code'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5 my-1" />
                <DropdownMenuItem onClick={handleDownloadSvg} className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded cursor-pointer outline-none">
                  <FileCode2 className="h-4 w-4 text-zinc-400" />
                  <span>Download SVG</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPng} className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-[#3fb950] hover:text-[#56d364] hover:bg-zinc-800/80 rounded cursor-pointer outline-none">
                  <FileImage className="h-4 w-4" />
                  <span>Download PNG</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 min-h-0 flex flex-col bg-zinc-900/10 border border-white/[0.03] rounded-xl overflow-hidden">
        {mode === 'code' && !analysis && (
          <div className="flex flex-col items-center justify-center h-full flex-1 space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-ui-active-text-green border-t-transparent" />
            <div className="text-center">
              <span className="text-xs text-zinc-400 font-semibold tracking-wider uppercase block">Loading Codebase Graph</span>
              <span className="text-[10px] text-zinc-500 block mt-1">Reading parsed AST topology...</span>
            </div>
          </div>
        )}

        {mode === 'ai' && isPending && (
          <div className="flex flex-col items-center justify-center h-full flex-1 space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-ui-active-text-green border-t-transparent" />
            <div className="text-center">
              <span className="text-xs text-zinc-400 font-semibold tracking-wider uppercase block">Analyzing Codebase Flow (AI)</span>
              <span className="text-[10px] text-zinc-500 block mt-1">Generating visual relationship graph...</span>
            </div>
          </div>
        )}

        {mode === 'ai' && isError && (
          <div className="flex flex-col items-center justify-center h-full flex-1 max-w-sm mx-auto text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Failed to generate AI diagram</h4>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed max-w-md">
                {error instanceof Error ? error.message : 'An error occurred while generating the architecture schema.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => generate({ owner, repo })}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Generation</span>
            </button>
          </div>
        )}

        {((mode === 'code' && analysis) || (mode === 'ai' && !isPending && !isError && data)) && (
          <div className="space-y-4 h-full flex flex-col flex-1 relative">
            {renderError ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-red-500/5 border border-red-500/10 rounded-xl flex-1">
                <span className="text-red-400 text-xs font-medium">{renderError}</span>
              </div>
            ) : !svg ? (
              <div className="flex flex-col items-center justify-center flex-1 space-y-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-ui-active-text-green border-t-transparent" />
                <span className="text-xs text-zinc-500 font-medium">Laying out SVG flowchart...</span>
              </div>
            ) : (
              <>
                <div
                  className="relative flex-1 w-full overflow-hidden bg-zinc-950/20 rounded-t-xl select-none cursor-grab active:cursor-grabbing"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                >
                  <div
                     ref={svgContainerRef}
                     className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
                     style={{
                       transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                       transformOrigin: 'center center',
                     }}
                     dangerouslySetInnerHTML={{ __html: svg }}
                  />

                  {/* Zoom Controls Overlay */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-0.5 bg-[#161b22] border border-white/5 rounded-md p-1 shadow-xl z-20">
                    <button
                      type="button"
                      onClick={() => setZoom(z => Math.max(0.15, z - 0.1))}
                      className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                      title="Zoom Out"
                    >
                      <span className="text-lg leading-none font-medium select-none mb-0.5">-</span>
                    </button>
                    <span className="text-[10px] font-mono font-medium text-zinc-400 px-1 select-none w-9 text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoom(z => Math.min(5, z + 0.1))}
                      className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                      title="Zoom In"
                    >
                      <span className="text-sm leading-none font-medium select-none">+</span>
                    </button>
                    <div className="w-px h-3.5 bg-zinc-800 mx-1" />
                    <button
                      type="button"
                      onClick={() => {
                        resetView();
                      }}
                      className="flex h-6 px-2 items-center justify-center rounded text-[10px] font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                      title="Reset view"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {!compact && (
                  <div className="bg-zinc-900/50 border-t border-white/[0.03] p-3 sm:px-4 sm:py-3 rounded-b-xl select-none flex items-center justify-between">
                    <div>
                      <h5 className="text-[11px] font-semibold text-zinc-300 mb-0.5">
                        {mode === 'code' ? 'Code Graph Diagram' : 'AI Enhanced Architecture'}
                      </h5>
                      <p className="text-[10px] text-zinc-500 max-w-2xl">
                        {mode === 'code' ? (
                          'Programmatically built by analyzing static file imports. Pan and zoom to inspect boundaries.'
                        ) : (
                          'Logical system architecture summarized by AI.'
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
