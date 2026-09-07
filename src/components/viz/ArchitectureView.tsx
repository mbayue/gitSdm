import { TooltipHint } from '@/components/ui/tooltip';
import { useRef } from 'react';
import DOMPurify from 'dompurify';
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

const mermaidSvgSanitizeConfig = {
  USE_PROFILES: { svg: true, svgFilters: true, html: true },
  ADD_TAGS: ['foreignObject', 'div', 'span', 'p'],
  ADD_ATTR: ['xmlns', 'style', 'class'],
};

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
    <div className={cn("flex h-full w-full flex-col bg-background", compact ? "p-2.5" : "p-4 lg:p-5")}>
      {/* Header Panel */}
      {!compact ? (
        <div className="workspace-view-header">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Network className="h-5 w-5 text-muted-foreground" />
              Architecture
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Structure and dependencies of <span className="font-mono text-foreground">{owner}/{repo}</span>
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Segmented Mode Selector */}
            <div className="flex items-center rounded-md border border-border bg-background p-0.5 mr-2">
              <button
                type="button"
                aria-pressed={mode === 'code'}
                onClick={() => setMode('code')}
                className={cn(
                  'rounded px-3 py-2 text-sm font-medium transition-all duration-150',
                  mode === 'code'
                    ? 'bg-secondary text-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Code Graph
              </button>
              <button
                type="button"
                aria-pressed={mode === 'ai'}
                onClick={() => setMode('ai')}
                className={cn(
                  'rounded px-3 py-2 text-sm font-medium transition-all duration-150',
                  mode === 'ai'
                    ? 'bg-secondary text-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
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
                    "flex items-center justify-center gap-1.5 rounded-lg border h-8 px-3 text-xs font-semibold transition-all outline-none focus:ring-2 focus:ring-ring/30",
                    svg ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:border-ring/50 active:scale-[0.98] shadow-md shadow-primary/20" : "border-border bg-card text-muted-foreground opacity-50 cursor-not-allowed"
                  )}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-xl rounded-md p-1 z-50">
                  <DropdownMenuItem onClick={handleCopySvg} className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground hover:text-foreground hover:bg-secondary rounded cursor-pointer outline-none">
                    {copiedSvg ? <Check className="h-4 w-4 text-accent" /> : <CodeXml className="h-4 w-4 text-muted-foreground" />}
                    <span>{copiedSvg ? 'Copied SVG!' : 'Copy SVG'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyCode} className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground hover:text-foreground hover:bg-secondary rounded cursor-pointer outline-none">
                    {copied ? <Check className="h-4 w-4 text-accent" /> : <Code className="h-4 w-4 text-muted-foreground" />}
                    <span>{copied ? 'Copied Code!' : 'Copy Mermaid Code'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border my-1" />
                  <DropdownMenuItem onClick={handleDownloadSvg} className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground hover:text-foreground hover:bg-secondary rounded cursor-pointer outline-none">
                    <FileCode2 className="h-4 w-4 text-muted-foreground" />
                    <span>Download SVG</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadPng} className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-accent hover:text-accent hover:bg-secondary rounded cursor-pointer outline-none">
                    <FileImage className="h-4 w-4" />
                    <span>Download PNG</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-border pb-2.5 select-none">
          {/* Segmented Mode Selector */}
          <div className="flex items-center rounded-md border border-border bg-background p-0.5">
            <button
              type="button"
              aria-pressed={mode === 'code'}
                onClick={() => setMode('code')}
              className={cn(
                'rounded px-2.5 py-0.5 text-xs font-semibold transition-all duration-150',
                mode === 'code'
                  ? 'bg-secondary text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Code Graph
            </button>
            <button
              type="button"
              aria-pressed={mode === 'ai'}
                onClick={() => setMode('ai')}
              className={cn(
                'rounded px-2.5 py-0.5 text-xs font-semibold transition-all duration-150',
                mode === 'ai'
                  ? 'bg-secondary text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              AI Enhanced
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <TooltipHint content={svg ? 'Export Diagram' : 'Wait for the diagram before exporting'} disabledTrigger={!svg}><DropdownMenuTrigger
                aria-label="Export Diagram"
                disabled={!svg}
                className="flex items-center justify-center rounded bg-card border border-border h-6 px-2 text-muted-foreground hover:text-foreground transition-colors outline-none"
              >
                <Download className="h-3.5 w-3.5" />
                <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
              </DropdownMenuTrigger></TooltipHint>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-xl rounded-md p-1 z-50">
                <DropdownMenuItem onClick={handleCopySvg} className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground hover:text-foreground hover:bg-secondary rounded cursor-pointer outline-none">
                  {copiedSvg ? <Check className="h-4 w-4 text-accent" /> : <CodeXml className="h-4 w-4 text-muted-foreground" />}
                  <span>{copiedSvg ? 'Copied SVG!' : 'Copy SVG'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyCode} className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground hover:text-foreground hover:bg-secondary rounded cursor-pointer outline-none">
                  {copied ? <Check className="h-4 w-4 text-accent" /> : <Code className="h-4 w-4 text-muted-foreground" />}
                  <span>{copied ? 'Copied Code!' : 'Copy Mermaid Code'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border my-1" />
                <DropdownMenuItem onClick={handleDownloadSvg} className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground hover:text-foreground hover:bg-secondary rounded cursor-pointer outline-none">
                  <FileCode2 className="h-4 w-4 text-muted-foreground" />
                  <span>Download SVG</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPng} className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-accent hover:text-accent hover:bg-secondary rounded cursor-pointer outline-none">
                  <FileImage className="h-4 w-4" />
                  <span>Download PNG</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 min-h-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
        {mode === 'code' && !analysis && (
          <div className="flex flex-col items-center justify-center h-full flex-1 space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-ui-active-text-green border-t-transparent" />
            <div className="text-center">
              <span className="text-xs text-muted-foreground font-semibold tracking-wider uppercase block">Loading Codebase Graph</span>
              <span className="text-xs text-muted-foreground block mt-1">Preparing the repository diagram…</span>
            </div>
          </div>
        )}

        {mode === 'ai' && isPending && (
          <div className="flex flex-col items-center justify-center h-full flex-1 space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-ui-active-text-green border-t-transparent" />
            <div className="text-center">
              <span className="text-xs text-muted-foreground font-semibold tracking-wider uppercase block">Analyzing Codebase Flow (AI)</span>
              <span className="text-xs text-muted-foreground block mt-1">Generating visual relationship graph...</span>
            </div>
          </div>
        )}

        {mode === 'ai' && isError && (
          <div className="flex flex-col items-center justify-center h-full flex-1 max-w-sm mx-auto text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-destructive border border-red-500/20">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Failed to generate AI diagram</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-md">
                {error instanceof Error ? error.message : 'An error occurred while generating the architecture schema.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => generate({ owner, repo })}
              className="flex items-center gap-1.5 rounded-lg bg-card border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary hover:text-foreground transition-all"
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
                <span className="text-destructive text-xs font-medium">{renderError}</span>
              </div>
            ) : !svg ? (
              <div className="flex flex-col items-center justify-center flex-1 space-y-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-ui-active-text-green border-t-transparent" />
                <span className="text-xs text-muted-foreground font-medium">Preparing the diagram…</span>
              </div>
            ) : (
              <>
                <div
                  className="relative flex-1 w-full overflow-hidden bg-background rounded-t-xl select-none cursor-grab active:cursor-grabbing"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                >
                  <div
                     ref={svgContainerRef}
                     role="img"
                     aria-label="Repository architecture diagram"
                     className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
                     style={{
                       transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                       transformOrigin: 'center center',
                     }}
	                     dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(svg, mermaidSvgSanitizeConfig) }}
	                  />

                  {/* Zoom Controls Overlay */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-0.5 bg-card border border-border rounded-md p-1 shadow-xl z-20">
                    <TooltipHint content="Zoom Out"><button aria-label="Zoom Out"
                      type="button"
                      onClick={() => setZoom(z => Math.max(0.15, z - 0.1))}
                      className="flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <span className="text-lg leading-none font-medium select-none mb-0.5">-</span>
                    </button></TooltipHint>
                    <span className="text-xs font-mono font-medium text-muted-foreground px-1 select-none w-9 text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <TooltipHint content="Zoom In"><button aria-label="Zoom In"
                      type="button"
                      onClick={() => setZoom(z => Math.min(5, z + 0.1))}
                      className="flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <span className="text-sm leading-none font-medium select-none">+</span>
                    </button></TooltipHint>
                    <div className="w-px h-3.5 bg-secondary mx-1" />
                    <TooltipHint content="Reset view"><button aria-label="Reset view"
                      type="button"
                      onClick={() => {
                        resetView();
                      }}
                      className="flex h-9 px-3 items-center justify-center rounded text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      Reset
                    </button></TooltipHint>
                  </div>
                </div>

                {!compact && (
                  <div className="bg-card border-t border-border p-3 sm:px-4 sm:py-3 rounded-b-xl select-none flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-semibold text-foreground mb-0.5">
                        {mode === 'code' ? 'Code Graph Diagram' : 'AI Enhanced Architecture'}
                      </h5>
                      <p className="text-xs text-muted-foreground max-w-2xl">
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
