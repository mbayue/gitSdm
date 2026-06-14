import { useReactFlow } from '@xyflow/react';
import { ZoomIn, ZoomOut, Maximize, Map, Crosshair } from 'lucide-react';
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
  const reactFlow = useReactFlow();
  const { triggerGraphAction } = useVizStore();

  const handleZoomIn = () => {
    triggerGraphAction('zoomIn');
    reactFlow.zoomIn({ duration: 250 });
  };

  const handleZoomOut = () => {
    triggerGraphAction('zoomOut');
    reactFlow.zoomOut({ duration: 250 });
  };

  const handleFitView = () => {
    triggerGraphAction('fitView');
    reactFlow.fitView({ duration: 400, padding: 0.35 });
  };

  const handleCenterView = () => {
    triggerGraphAction('centerView');
    const { selectedNodeId } = useVizStore.getState();
    if (selectedNodeId) {
      const node = reactFlow.getNode(selectedNodeId);
      if (node) {
        const width = node.measured?.width ?? node.width ?? 0;
        const height = node.measured?.height ?? node.height ?? 0;
        reactFlow.setCenter(node.position.x + width / 2, node.position.y + height / 2, {
          duration: 400,
          zoom: 1.2,
        });
        return;
      }
    }
    
    // Find the repository root node and center on it
    const nodes = reactFlow.getNodes();
    const repoNode = nodes.find((n) => n.type === 'repo');
    if (repoNode) {
      const width = repoNode.measured?.width ?? repoNode.width ?? 0;
      const height = repoNode.measured?.height ?? repoNode.height ?? 0;
      reactFlow.setCenter(repoNode.position.x + width / 2, repoNode.position.y + height / 2, {
        duration: 400,
        zoom: 1.0,
      });
      return;
    }

    reactFlow.setCenter(0, 0, { zoom: 1, duration: 400 });
  };

  return (
    <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1 rounded-full border border-white/[0.04] bg-zinc-950/80 p-1 shadow-md backdrop-blur-md select-none font-sans">
      {/* Zoom Out */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={handleZoomOut}
          className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all outline-none cursor-pointer"
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
          className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all outline-none cursor-pointer"
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
          className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all outline-none cursor-pointer"
        >
          <Maximize className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top">Fit View</TooltipContent>
      </Tooltip>

      {/* Center View */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={handleCenterView}
          className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all outline-none cursor-pointer"
        >
          <Crosshair className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top">Center View</TooltipContent>
      </Tooltip>

      <div className="w-px h-4 bg-white/[0.08] mx-0.5" />

      {/* Minimap Toggle */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={() => setShowMinimap(!showMinimap)}
          className={`flex h-7 w-7 items-center justify-center rounded-full active:scale-95 transition-all outline-none cursor-pointer ${
            showMinimap
              ? 'bg-zinc-850 text-zinc-100 border border-white/10 shadow-inner'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
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
