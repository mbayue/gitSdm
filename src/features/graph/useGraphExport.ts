import { useCallback, useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import type { ForceGraphMethods } from "react-force-graph-2d";
import type {
  ForceGraphNode,
  ForceGraphLink,
} from "./force/forceGraphConstants";
import { useVizStore } from "@/stores/vizStore";

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
  forceGraphRef: RefObject<
    ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined
  >;
  forceHostRef: RefObject<HTMLDivElement | null>;
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
      if (!host || !canvas) return;

      const origWidth = host.style.width;
      const origHeight = host.style.height;

      const rect = host.getBoundingClientRect();
      host.style.width = `${rect.width * 2}px`;
      host.style.height = `${rect.height * 2}px`;

      const fg = opts.forceGraphRef.current;
      if (fg) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        fg.zoomToFit(650, 90);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const exportCanvas = host.querySelector("canvas");
      if (!exportCanvas) return;
      const cw = exportCanvas.width;
      const ch = exportCanvas.height;

      const bgCanvas = document.createElement("canvas");
      bgCanvas.width = cw;
      bgCanvas.height = ch;
      const bgCtx = bgCanvas.getContext("2d")!;
      bgCtx.fillStyle = opts.backgroundColor ?? "#0f0f1a";
      bgCtx.fillRect(0, 0, cw, ch);
      bgCtx.drawImage(exportCanvas, 0, 0);

      const dataUrl = bgCanvas.toDataURL("image/png");

      host.style.width = origWidth;
      host.style.height = origHeight;
      if (fg) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        fg.zoomToFit(650, 90);
      }

      const filename = `${opts.owner}_${opts.repo}_${opts.filenameSuffix}`;
      if (format === "png") {
        downloadDataUrl(dataUrl, `${filename}.png`);
      } else {
        savePdf(dataUrl, `${filename}.pdf`, cw / 2, ch / 2);
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
