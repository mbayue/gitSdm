import { Maximize2, Minus, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GraphZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  className?: string;
}

export function GraphZoomControls({ onZoomIn, onZoomOut, onFitView, className = '' }: GraphZoomControlsProps) {
  return (
    <div className={`graph-controls flex items-center gap-0.5 rounded-lg border border-white/[0.08] bg-zinc-950/90 p-1 shadow-lg shadow-black/45 backdrop-blur-md ${className}`}>
      <Tooltip>
        <TooltipTrigger
          className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
          onClick={onZoomIn}
          aria-label="Zoom In"
        >
          <Plus className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top">Zoom In</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
          onClick={onZoomOut}
          aria-label="Zoom Out"
        >
          <Minus className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top">Zoom Out</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
          onClick={onFitView}
          aria-label="Fit View"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top">Fit View</TooltipContent>
      </Tooltip>
    </div>
  );
}