import { Maximize2, Minus, Plus } from 'lucide-react';

interface GraphZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  className?: string;
}

export function GraphZoomControls({ onZoomIn, onZoomOut, onFitView, className = '' }: GraphZoomControlsProps) {
  return (
    <div className={`graph-controls absolute left-3 bottom-3 z-10 flex items-center rounded-md border border-white/[0.08] bg-zinc-950/80 backdrop-blur-md overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={onZoomIn}
        className="px-2 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors border-r border-white/[0.08]"
        title="Zoom in"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        className="px-2 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors border-r border-white/[0.08]"
        title="Zoom out"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onFitView}
        className="px-2 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
        title="Fit view"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}