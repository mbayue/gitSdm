import { useEffect, useRef } from 'react';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import type { ForceGraphNode, ForceGraphLink } from '../../force/forceGraphConstants';

interface ForceMinimapProps {
  nodes: ForceGraphNode[];
  forceGraphRef: React.MutableRefObject<ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined>;
  width: number;
  height: number;
  isDark: boolean;
  tick: number;
}

export function ForceMinimap({ nodes, forceGraphRef, width, height, isDark, tick }: ForceMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fg = forceGraphRef.current;
    if (!fg) return;

    // Get current center and zoom from force-graph API
    const center = fg.centerAt(); // returns { x, y }
    const zoom = fg.zoom(); // returns number

    if (!center || typeof zoom !== 'number' || zoom <= 0) return;

    const mapWidth = 200;
    const mapHeight = 150;

    // Calculate graph bounds
    let minX = -100, maxX = 100, minY = -100, maxY = 100;
    if (nodes.length > 0) {
      const xs = nodes.map(n => n.x ?? 0);
      const ys = nodes.map(n => n.y ?? 0);
      minX = Math.min(...xs);
      maxX = Math.max(...xs);
      minY = Math.min(...ys);
      maxY = Math.max(...ys);
    }
    const padding = 60;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;

    const scaleX = mapWidth / graphWidth;
    const scaleY = mapHeight / graphHeight;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (mapWidth - graphWidth * scale) / 2 - minX * scale;
    const offsetY = (mapHeight - graphHeight * scale) / 2 - minY * scale;

    const toMinimapCoords = (nx: number, ny: number) => ({
      x: nx * scale + offsetX,
      y: ny * scale + offsetY,
    });

    // Clear canvas
    ctx.clearRect(0, 0, mapWidth, mapHeight);

    // Draw nodes
    nodes.forEach((n) => {
      if (typeof n.x !== 'number' || typeof n.y !== 'number') return;
      const { x, y } = toMinimapCoords(n.x, n.y);
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = n.color || '#8b5cf6';
      ctx.fill();
    });

    // Calculate D3 coordinates of the screen viewport edges
    const halfWidthInD3 = (width / 2) / zoom;
    const halfHeightInD3 = (height / 2) / zoom;

    const vMinX = center.x - halfWidthInD3;
    const vMaxX = center.x + halfWidthInD3;
    const vMinY = center.y - halfHeightInD3;
    const vMaxY = center.y + halfHeightInD3;

    const tl = toMinimapCoords(vMinX, vMinY);
    const br = toMinimapCoords(vMaxX, vMaxY);

    // Draw viewport bounds
    ctx.strokeStyle = isDark ? 'rgba(139, 92, 246, 0.55)' : 'rgba(109, 40, 217, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    ctx.fillStyle = isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(109, 40, 217, 0.05)';
    ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
  }, [nodes, forceGraphRef, width, height, isDark, tick]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={150}
      className="block"
      style={{ width: 200, height: 150 }}
    />
  );
}
