import React, { useCallback, useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import type { ForceGraphMethods } from "react-force-graph-2d";
import type {
  ForceGraphNode,
  ForceGraphLink,
} from "./force/forceGraphConstants";
import { useVizStore } from "@/stores/vizStore";
import { GRAPH_THEMES } from './force/graph-theme';

type ExportFormat = "png" | "pdf";

interface BaseGraphExportOptions {
  owner: string;
  repo: string;
  filenameSuffix: string;
}

interface DomGraphExportOptions extends BaseGraphExportOptions {
  mode: "dom";
  getElement: () => HTMLElement | null;
  backgroundColor: string;
  beforeExport?: () => Promise<void> | void;
  afterExport?: () => Promise<void> | void;
}

interface ForceGraphExportOptions extends BaseGraphExportOptions {
  mode: "force";
  forceGraphRef: React.RefObject<
    ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined
  >;
  forceHostRef: React.RefObject<HTMLDivElement | null>;
  backgroundColor?: string;
}

type GraphExportOptions = DomGraphExportOptions | ForceGraphExportOptions;

const excludedExportClasses = new Set([
  "react-flow__controls",
  "react-flow__panel",
  "react-flow__attribution",
  "graph-controls",
  "export-panel",
  "graph-legend",
]);

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function savePdf(
  dataUrl: string,
  filename: string,
  width: number,
  height: number,
) {
  const pdf = new jsPDF({
    orientation: width > height ? "landscape" : "portrait",
    unit: "px",
    format: [width, height],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
  pdf.save(filename);
}

export function useGraphExport(options: GraphExportOptions) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);

  const handleDomExport = useCallback(
    async (format: ExportFormat, opts: DomGraphExportOptions) => {
      const el = opts.getElement();
      if (!el) return;

      await opts.beforeExport?.();

      const dataUrl = await toPng(el, {
        backgroundColor: opts.backgroundColor,
        quality: 0.98,
        pixelRatio: 2,
        filter: (node: HTMLElement) => {
          if (!node.classList) return true;
          for (const className of excludedExportClasses) {
            if (node.classList.contains(className)) return false;
          }
          return true;
        },
      });

      const filename = `${opts.owner}_${opts.repo}_${opts.filenameSuffix}`;
      if (format === "png") {
        downloadDataUrl(dataUrl, `${filename}.png`);
      } else {
        const rect = el.getBoundingClientRect();
        savePdf(dataUrl, `${filename}.pdf`, rect.width, rect.height);
      }

      await opts.afterExport?.();
    },
    [],
  );

  const handleForceExport = useCallback(
    async (format: ExportFormat, opts: ForceGraphExportOptions) => {
      const host = opts.forceHostRef.current;
      const canvas = host?.querySelector("canvas");
      if (!host || !canvas) throw new Error('The graph is not ready to export.');

      const fg = opts.forceGraphRef.current;
      const originalCenter = fg?.centerAt();
      const originalZoom = fg?.zoom();
      let dataUrl: string;
      let width: number;
      let height: number;

      try {
        // Capture at the canvas's native pixel density without resizing the workspace.
        // Two frames let the camera and canvas paint settle before reading pixels.
        fg?.zoomToFit(0, 60);
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        const exportCanvas = host.querySelector('canvas');
        if (!exportCanvas) throw new Error('The graph is not ready to export.');
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = exportCanvas.width;
        bgCanvas.height = exportCanvas.height;
        const bgCtx = bgCanvas.getContext('2d');
        if (!bgCtx) throw new Error('Unable to create an export image.');
        bgCtx.fillStyle = opts.backgroundColor ?? GRAPH_THEMES[useVizStore.getState().theme].background;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        bgCtx.drawImage(exportCanvas, 0, 0);
        dataUrl = bgCanvas.toDataURL('image/png');
        width = bgCanvas.width;
        height = bgCanvas.height;
      } finally {
        if (fg && originalCenter && originalZoom !== undefined) {
          fg.centerAt(originalCenter.x, originalCenter.y, 0);
          fg.zoom(originalZoom, 0);
        }
      }

      const filename = `${opts.owner}_${opts.repo}_${opts.filenameSuffix}`;
      if (format === 'png') {
        downloadDataUrl(dataUrl, `${filename}.png`);
      } else {
        // jsPDF page size is in CSS px; native canvas pixels are scaled by
        // devicePixelRatio, so use layout dims to avoid oversized pages on HiDPI.
        const cssWidth = host.clientWidth || canvas.clientWidth || width;
        const cssHeight = host.clientHeight || canvas.clientHeight || height;
        savePdf(dataUrl, `${filename}.pdf`, cssWidth, cssHeight);
      }
    },
    [],
  );

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setIsExporting(true);
      setExportFormat(format);

      try {
        if (options.mode === "dom") {
          await handleDomExport(format, options);
        } else {
          await handleForceExport(format, options);
        }
      } catch (err) {
        const setToastMessage = useVizStore.getState().setToastMessage;
        setToastMessage("Failed to export graph: " + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsExporting(false);
        setExportFormat(null);
      }
    },
    [handleDomExport, handleForceExport, options],
  );

  return { handleExport, isExporting, exportFormat };
}
