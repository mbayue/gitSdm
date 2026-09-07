
import { ZoomIn, ZoomOut, Maximize, Map, RefreshCcw, Target } from 'lucide-react';
import { useVizStore } from '@/stores/vizStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FloatingGraphControlsProps {
  showMinimap: boolean;
  setShowMinimap: (show: boolean) => void;
}

export function FloatingGraphControls({
  showMinimap,
  setShowMinimap,
}: FloatingGraphControlsProps) {
  const { triggerGraphAction, resetFilters } = useVizStore();

  const handleZoomIn = () => {
    triggerGraphAction('zoomIn');
  };

  const handleZoomOut = () => {
    triggerGraphAction('zoomOut');
  };

  const handleFitView = () => {
    triggerGraphAction('fitView');
  };

  const handleFocusGraph = () => {
    triggerGraphAction('focusGraph');
  };

  const handleResetView = () => {
    resetFilters();
    triggerGraphAction('reset');
    
    const { setSelectedNodeId, setFocusedFilePath, setHighlightedNodeIds } = useVizStore.getState();
    setSelectedNodeId(null);
    setFocusedFilePath(null);
    setHighlightedNodeIds(new Set());
  };

  return (
    <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1 rounded-md border border-border bg-popover p-1 shadow-md select-none font-sans">
      {/* Zoom Out */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          aria-label="Zoom out"
          onClick={handleZoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          <ZoomOut className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="top">Zoom Out</TooltipContent>
      </Tooltip>

      {/* Zoom In */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          aria-label="Zoom in"
          onClick={handleZoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          <ZoomIn className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="top">Zoom In</TooltipContent>
      </Tooltip>

      {/* Fit Screen */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          aria-label="Fit graph to view"
          onClick={handleFitView}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          <Maximize className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="top">Fit View</TooltipContent>
      </Tooltip>

      {/* Focus Graph */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          aria-label="Focus selection"
          onClick={handleFocusGraph}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          <Target className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="top">Focus Graph</TooltipContent>
      </Tooltip>

      {/* Reset View */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          aria-label="Reset graph and filters"
          onClick={handleResetView}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          <RefreshCcw className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="top">Reset View</TooltipContent>
      </Tooltip>

      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Minimap Toggle */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          aria-label="Toggle minimap"
          aria-pressed={showMinimap}
          onClick={() => setShowMinimap(!showMinimap)}
          className={`flex h-9 w-9 items-center justify-center rounded-md active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
            showMinimap
              ? 'bg-secondary text-foreground border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <Map className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="top">
          Minimap: {showMinimap ? 'ON' : 'OFF'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
export default FloatingGraphControls;
