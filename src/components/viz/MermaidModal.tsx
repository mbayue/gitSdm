import { useEffect, useRef, useState } from 'react';
import { X, Copy, Download, RefreshCw, Network, Check } from 'lucide-react';
import mermaid from 'mermaid';
import { useMermaid } from '@/features/ai/useAI';

// Initialize mermaid with custom dark theme variables
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    background: '#09090b',
    primaryColor: '#6d28d9',
    primaryTextColor: '#fff',
    lineColor: '#3f3f46',
    nodeBorder: '#27272a',
    mainBkg: '#18181b',
  },
});

interface MermaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
}

export function MermaidModal({ isOpen, onClose, owner, repo }: MermaidModalProps) {
  const { mutate: generate, data, isPending, isError, error, reset } = useMermaid();
  const [svg, setSvg] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Zoom and pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Trigger diagram generation on open
  useEffect(() => {
    if (isOpen) {
      generate({ owner, repo });
    } else {
      reset();
    }
  }, [isOpen, owner, repo, generate, reset]);

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Render the diagram to SVG when raw data is received
  useEffect(() => {
    if (!data?.diagram) return;
    let active = true;
    setRenderError(null);
    setSvg('');
    setZoom(1);
    setPan({ x: 0, y: 0 });

    // Clean up markdown block format
    let code = data.diagram.trim();
    if (code.startsWith('```mermaid')) {
      code = code.slice(10);
    } else if (code.startsWith('```')) {
      code = code.slice(3);
    }
    if (code.endsWith('```')) {
      code = code.slice(0, -3);
    }
    code = code.trim();

    const id = `mermaid-modal-svg-${Math.floor(Math.random() * 1000000)}`;

    mermaid.render(id, code)
      .then(({ svg: renderedSvg }) => {
        if (active) {
          // Adjust styles to fit and look modern
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
        // Cleanup bad nodes added to document body by mermaid
        const badEl = document.getElementById(id);
        if (badEl) badEl.remove();
        const badBind = document.getElementById(`d${id}`);
        if (badBind) badBind.remove();
      });

    return () => {
      active = false;
    };
  }, [data]);

  const handleCopyCode = async () => {
    if (!data?.diagram) return;
    try {
      await navigator.clipboard.writeText(data.diagram);
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

  const handleRetry = () => {
    generate({ owner, repo });
  };

  // SVG drag and zoom event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click drags
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div className="relative z-10 flex flex-col w-full max-w-5xl h-[85vh] rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden transition-all duration-300">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 bg-zinc-900/20 px-5 py-4 select-none">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400">
              <Network className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white leading-none">System Architecture Flowchart</h3>
              <p className="text-[10px] text-zinc-500 mt-1 font-mono">{owner}/{repo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && svg && (
              <>
                <button
                  type="button"
                  onClick={handleCopySvg}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all active:scale-[0.98]"
                >
                  {copiedSvg ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
                  <span>{copiedSvg ? 'Copied SVG!' : 'Copy SVG'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all active:scale-[0.98]"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
                  <span>{copied ? 'Copied Code!' : 'Copy Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(109,40,217,0.25)]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download SVG</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-zinc-950 custom-scrollbar flex flex-col">
          {isPending && (
            <div className="flex flex-col items-center justify-center h-full flex-1 space-y-4">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-violet-500 border-t-transparent" />
              <div className="text-center">
                <span className="text-xs text-zinc-400 font-semibold tracking-wider uppercase block">Analyzing Codebase Flow</span>
                <span className="text-[10px] text-zinc-500 block mt-1">Generating visual relationship graph...</span>
              </div>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center h-full flex-1 max-w-sm mx-auto text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                <X className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Failed to generate diagram</h4>
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed max-w-md">
                  {error instanceof Error ? error.message : 'An error occurred while generating the architecture schema.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Generation</span>
              </button>
            </div>
          )}

          {!isPending && !isError && data && (
            <div className="space-y-4 h-full flex flex-col flex-1">
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
                <div
                  className="relative flex-1 w-full h-[50vh] min-h-[380px] overflow-hidden bg-zinc-900/20 border border-zinc-800/40 rounded-xl select-none cursor-grab active:cursor-grabbing"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                >
                  {/* SVG Render Container */}
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
                  <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-zinc-950/80 border border-zinc-800 rounded-lg p-1 shadow-lg backdrop-blur-sm z-20">
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
                    <div className="w-px h-4 bg-zinc-800 mx-1" />
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
              )}

              <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-3.5">
                <h5 className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">Architecture Tip</h5>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  This diagram represents the parsed structure computed from module imports and codebase entry points.
                  You can copy the raw **Mermaid Code** to paste into markdown files, or copy/download the rendered **SVG image** for diagrams, documentations, and code reviews.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
