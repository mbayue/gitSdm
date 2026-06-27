
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
    <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161b22] p-1 shadow-md select-none font-sans">
      {/* Zoom Out */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={handleZoomOut}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#8b949e] hover:text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] active:scale-95 transition-all outline-none cursor-pointer"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top">Zoom Out</TooltipContent>
      </Tooltip>

      {/* Zoom In */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={handleZoomIn}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#8b949e] hover:text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] active:scale-95 transition-all outline-none cursor-pointer"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top">Zoom In</TooltipContent>
      </Tooltip>

      {/* Fit Screen */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={handleFitView}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#8b949e] hover:text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] active:scale-95 transition-all outline-none cursor-pointer"
        >
          <Maximize className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top">Fit View</TooltipContent>
      </Tooltip>

      {/* Focus Graph */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={handleFocusGraph}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#8b949e] hover:text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] active:scale-95 transition-all outline-none cursor-pointer"
        >
          <Target className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top">Focus Graph</TooltipContent>
      </Tooltip>

      {/* Reset View */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={handleResetView}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#8b949e] hover:text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] active:scale-95 transition-all outline-none cursor-pointer"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top">Reset View</TooltipContent>
      </Tooltip>

      <div className="w-px h-4 bg-[rgba(240,246,252,0.1)] mx-0.5" />

      {/* Minimap Toggle */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={() => setShowMinimap(!showMinimap)}
          className={`flex h-7 w-7 items-center justify-center rounded-full active:scale-95 transition-all outline-none cursor-pointer ${
            showMinimap
              ? 'bg-[#1c2128] text-[#e6edf3] border border-[rgba(240,246,252,0.1)]'
              : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)]'
          }`}
        >
          <Map className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top">
          Minimap: {showMinimap ? 'ON' : 'OFF'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
export default FloatingGraphControls;
