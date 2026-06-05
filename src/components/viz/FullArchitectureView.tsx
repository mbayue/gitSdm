import { useEffect, useRef, useState } from 'react';
import { Copy, Download, RefreshCw, Network, Check } from 'lucide-react';
import mermaid from 'mermaid';
import { useMermaid } from '@/features/ai/useAI';
import { cn } from '@/lib/utils';
import type { RepoAnalysis } from '@/types';
import { toPng } from 'html-to-image';

// Initialize mermaid with custom dark theme variables and premium styling overrides
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
  },
  themeVariables: {
    background: '#09090b',
    primaryColor: '#6d28d9',
    primaryTextColor: '#f4f4f5',
    lineColor: '#3f3f46',
    nodeBorder: '#3f3f46',
    mainBkg: '#18181b',
    actorBkg: '#18181b',
    actorBorder: '#3f3f46',
    actorTextColor: '#f4f4f5',
    signalColor: '#a1a1aa',
    signalLineColor: '#3f3f46',
    labelBoxBkgColor: '#18181b',
    labelBoxBorderColor: '#3f3f46',
    labelTextColor: '#f4f4f5',
    loopBkgColor: '#18181b',
    loopBorderColor: '#3f3f46',
    noteBkgColor: '#18181b',
    noteBorderColor: '#3f3f46',
    noteTextColor: '#f4f4f5',
  },
  themeCSS: `
    .node rect, .node polygon, .node circle, .node path {
      fill: #18181b;
      stroke: #3f3f46;
      stroke-width: 1.5px;
      rx: 8px;
      ry: 8px;
      transition: all 0.2s ease-in-out;
    }
    
    .node:hover rect, .node:hover polygon, .node:hover circle, .node:hover path {
      fill: #242427 !important;
      stroke: #8b5cf6 !important;
      filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.45));
      cursor: pointer;
    }

    .edgePath .path {
      stroke: #52525b !important;
      stroke-width: 1.5px !important;
      transition: all 0.2s ease-in-out;
    }
    .edgePath:hover .path {
      stroke: #a78bfa !important;
      stroke-width: 2px !important;
    }
    .edgePath .markerPath {
      fill: #52525b !important;
      stroke: none !important;
      transition: all 0.2s ease-in-out;
    }
    .edgePath:hover .markerPath {
      fill: #a78bfa !important;
    }

    .cluster rect {
      fill: rgba(24, 24, 27, 0.2) !important;
      stroke: rgba(63, 63, 70, 0.4) !important;
      stroke-width: 1.5px !important;
      rx: 12px !important;
      ry: 12px !important;
    }
    .cluster-label, .cluster-label text, .cluster-label span, .cluster-label div, .cluster-label p, .cluster-label a, .cluster-label a:visited, .cluster-label a:hover {
      fill: #e4e4e7 !important;
      color: #e4e4e7 !important;
      font-family: 'Outfit', 'Inter', system-ui, sans-serif !important;
      font-weight: 600 !important;
      font-size: 11px !important;
      letter-spacing: 0.05em !important;
      text-transform: uppercase !important;
      text-decoration: none !important;
    }
    .cluster-label {
      translate: 0 8px !important;
    }
    .cluster-label foreignObject div, .cluster-label p {
      line-height: 1.2 !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .node text, .node .label, .node .label text, .node .label div, .node .label span, .node span, .node div, .node a, .node a:visited, .node a:hover {
      color: #f4f4f5 !important;
      fill: #f4f4f5 !important;
      font-family: 'Inter', system-ui, sans-serif !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      text-decoration: none !important;
    }

    .node.entry rect, .node.entry polygon {
      fill: #1e1b4b !important;
      stroke: #8b5cf6 !important;
      stroke-width: 2px !important;
    }
    .node.router rect, .node.router polygon {
      fill: #064e3b !important;
      stroke: #10b981 !important;
    }
    .node.service rect, .node.service polygon {
      fill: #172554 !important;
      stroke: #3b82f6 !important;
    }
    .node.util rect, .node.util polygon {
      fill: #18181b !important;
      stroke: #71717a !important;
    }
    .node.db rect, .node.db polygon {
      fill: #581c87 !important;
      stroke: #d946ef !important;
    }
    .node.config rect, .node.config polygon {
      fill: #451a03 !important;
      stroke: #f59e0b !important;
    }
    .node.test rect, .node.test polygon {
      fill: #0c4a6e !important;
      stroke: #0284c7 !important;
    }
  `,
});

interface FullArchitectureViewProps {
  analysis: RepoAnalysis;
  owner: string;
  repo: string;
}

function generateProgrammaticMermaid(analysis: RepoAnalysis): string {
  const nodes = analysis.graph?.nodes?.filter((n) => n.type === 'file') || [];
  const edges = analysis.graph?.edges || [];

  const fileConnectivity = new Map<string, { incoming: number; outgoing: number }>();

  nodes.forEach((n) => {
    fileConnectivity.set(n.id, { incoming: 0, outgoing: 0 });
  });

  edges.forEach((e) => {
    const source = fileConnectivity.get(e.source);
    const target = fileConnectivity.get(e.target);
    if (source) source.outgoing++;
    if (target) target.incoming++;
  });

  const scoredNodes = nodes.map((n) => {
    const conn = fileConnectivity.get(n.id) || { incoming: 0, outgoing: 0 };
    const degree = conn.incoming + conn.outgoing;
    let score = degree;
    if (n.data?.fileClass === 'entry') score += 10;
    if (analysis.importantFiles?.includes(n.data?.path || '')) score += 5;
    return { node: n, score };
  });

  scoredNodes.sort((a, b) => b.score - a.score);
  const topScored = scoredNodes.slice(0, 25);
  const keptNodeIds = new Set(topScored.map((sn) => sn.node.id));
  const keptNodes = topScored.map((sn) => sn.node);

  const foldersMap = new Map<string, typeof keptNodes>();
  keptNodes.forEach((node) => {
    const path = node.data?.path || '';
    const parts = path.split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
    if (!foldersMap.has(folder)) {
      foldersMap.set(folder, []);
    }
    foldersMap.get(folder)!.push(node);
  });

  const lines: string[] = ['graph LR'];

  let folderIdCounter = 0;
  foldersMap.forEach((files, folderPath) => {
    const folderId = `dir_${folderIdCounter++}`;
    lines.push(`  subgraph ${folderId} ["${folderPath}"]`);
    files.forEach((node) => {
      const label = (node.data?.label || '').replace(/"/g, '\\"');
      const mermaidId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
      lines.push(`    ${mermaidId}["${label}"]`);
    });
    lines.push('  end');
  });

  const addedEdges = new Set<string>();
  edges.forEach((edge) => {
    const srcId = edge.source;
    const tgtId = edge.target;
    if (keptNodeIds.has(srcId) && keptNodeIds.has(tgtId)) {
      const srcMermaidId = srcId.replace(/[^a-zA-Z0-9_]/g, '_');
      const tgtMermaidId = tgtId.replace(/[^a-zA-Z0-9_]/g, '_');
      const edgeKey = `${srcMermaidId}-->${tgtMermaidId}`;
      if (!addedEdges.has(edgeKey)) {
        lines.push(`  ${srcMermaidId} --> ${tgtMermaidId}`);
        addedEdges.add(edgeKey);
      }
    }
  });

  keptNodes.forEach((node) => {
    const mermaidId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
    let cls = 'service';
    if (node.data?.fileClass === 'entry') cls = 'entry';
    else if (node.data?.fileClass === 'config') cls = 'config';
    else if (node.data?.fileClass === 'test') cls = 'test';
    lines.push(`  class ${mermaidId} ${cls}`);
  });

  return lines.join('\n');
}

export function FullArchitectureView({ analysis, owner, repo }: FullArchitectureViewProps) {
  const { mutate: generate, data, isPending, isError, error } = useMermaid();
  const [svg, setSvg] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<'code' | 'ai'>('code');

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (mode === 'ai' && !data) {
      generate({ owner, repo });
    }
  }, [mode, data, owner, repo, generate]);

  useEffect(() => {
    let code = '';
    if (mode === 'code') {
      if (!analysis) return;
      code = generateProgrammaticMermaid(analysis);
    } else {
      if (!data?.diagram) return;
      code = data.diagram.trim();
      if (code.startsWith('```mermaid')) {
        code = code.slice(10);
      } else if (code.startsWith('```')) {
        code = code.slice(3);
      }
      if (code.endsWith('```')) {
        code = code.slice(0, -3);
      }
      code = code.trim();
    }

    if (!code) return;

    let active = true;
    setRenderError(null);
    setSvg('');
    setZoom(1);
    setPan({ x: 0, y: 0 });

    const id = `mermaid-view-svg-${Math.floor(Math.random() * 1000000)}`;

    mermaid.render(id, code)
      .then(({ svg: renderedSvg }) => {
        if (active) {
          let styled = renderedSvg;
          if (renderedSvg.includes('width=')) {
            styled = renderedSvg
              .replace(/width="[^"]+"/, 'width="100%"')
              .replace(/height="[^"]+"/, 'style="max-height: 100%; max-width: 100%; width: 100%; height: auto;"');
          }
          setSvg(styled);
        }
      })
      .catch((err) => {
        console.error('Failed to parse mermaid syntax:', err);
        if (active) {
          setRenderError('Failed to layout flowchart. This can happen with complex circular dependencies.');
        }
        const badEl = document.getElementById(id);
        if (badEl) badEl.remove();
        const badBind = document.getElementById(`d${id}`);
        if (badBind) badBind.remove();
      });

    return () => {
      active = false;
    };
  }, [mode, data, analysis]);

  const handleCopyCode = async () => {
    const rawCode = mode === 'ai' ? data?.diagram : generateProgrammaticMermaid(analysis);
    if (!rawCode) return;
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopySvg = async () => {
    if (!svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector('svg');
    if (!svgEl) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      await navigator.clipboard.writeText(svgData);
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector('svg');
    if (!svgEl) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.href = svgUrl;
      link.download = `${repo}_architecture.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleDownloadPng = async () => {
    if (!svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector('svg');
    if (!svgEl) return;
    try {
      const dataUrl = await toPng(svgEl as unknown as HTMLElement, {
        backgroundColor: '#09090b',
        quality: 0.95,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${repo}_architecture.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download PNG failed', err);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.08;
    const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    setZoom(Math.max(0.15, Math.min(5, nextZoom)));
  };

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950 p-6">
      {/* Header Panel */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/5 pb-5 sm:flex-row sm:items-center select-none">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Network className="h-5 w-5 text-violet-400 animate-pulse" />
            System Architecture Flowchart
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

          {svg && (
            <>
              <button
                type="button"
                onClick={handleCopySvg}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-350 hover:bg-zinc-800 hover:text-white transition-all active:scale-[0.98]"
              >
                {copiedSvg ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
                <span>{copiedSvg ? 'Copied SVG!' : 'Copy SVG'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-355 hover:bg-zinc-800 hover:text-white transition-all active:scale-[0.98]"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
                <span>{copied ? 'Copied Code!' : 'Copy Code'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all active:scale-[0.98]"
              >
                <Download className="h-3.5 w-3.5 text-zinc-400" />
                <span>Download SVG</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPng}
                className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(109,40,217,0.25)]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download PNG</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 min-h-0 flex flex-col bg-zinc-900/10 border border-white/[0.03] rounded-xl overflow-hidden">
        {mode === 'code' && !analysis && (
          <div className="flex flex-col items-center justify-center h-full flex-1 space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-violet-500 border-t-transparent" />
            <div className="text-center">
              <span className="text-xs text-zinc-400 font-semibold tracking-wider uppercase block">Loading Codebase Graph</span>
              <span className="text-[10px] text-zinc-500 block mt-1">Reading parsed AST topology...</span>
            </div>
          </div>
        )}

        {mode === 'ai' && isPending && (
          <div className="flex flex-col items-center justify-center h-full flex-1 space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-violet-500 border-t-transparent" />
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
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
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
                  <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-zinc-950/80 border border-white/5 rounded-lg p-1 shadow-lg backdrop-blur-sm z-20">
                    <button
                      type="button"
                      onClick={() => setZoom(z => Math.max(0.15, z - 0.1))}
                      className="flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      title="Zoom Out"
                    >
                      <span className="text-sm leading-none font-bold select-none">-</span>
                    </button>
                    <span className="text-[10px] font-mono text-zinc-500 px-1 select-none min-w-[36px] text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoom(z => Math.min(5, z + 0.1))}
                      className="flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      title="Zoom In"
                    >
                      <span className="text-sm leading-none font-bold select-none">+</span>
                    </button>
                    <div className="w-px h-4 bg-zinc-850 mx-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setZoom(1);
                        setPan({ x: 0, y: 0 });
                      }}
                      className="flex h-7 px-2 items-center justify-center rounded hover:bg-zinc-800 text-[10px] font-semibold text-zinc-400 hover:text-white transition-colors"
                      title="Reset view"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-950/40 border-t border-white/5 p-4 rounded-b-xl select-none">
                  <h5 className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">
                    {mode === 'code' ? 'Code Graph Architecture Tip' : 'AI Enhanced Architecture Tip'}
                  </h5>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    {mode === 'code' ? (
                      'This diagram is programmatically built client-side by analyzing static file imports, grouped inside bounding boxes named after directory subfolders. Zoom and pan to inspect module boundaries.'
                    ) : (
                      'This diagram represents the logical system architecture and dependencies summarized by the Gemini LLM. You can download the rendered SVG or copy/paste the Mermaid raw markdown.'
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
