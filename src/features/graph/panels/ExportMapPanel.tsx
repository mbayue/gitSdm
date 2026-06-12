import { Download } from 'lucide-react';

interface ExportMapPanelProps {
  onExport: (format: 'png' | 'pdf') => void;
  isExporting?: boolean;
  exportFormat?: 'png' | 'pdf' | null;
}

export function ExportMapPanel({ onExport, isExporting, exportFormat }: ExportMapPanelProps) {
  return (
    <div className="absolute left-3 top-3 z-10 hidden md:flex items-center gap-2 rounded-xl border border-white/5 bg-zinc-950/80 p-2 text-xs text-zinc-300 shadow-2xl backdrop-blur-md select-none">
      <div className="flex items-center gap-1.5 border-r border-white/5 pr-2 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        Export Map
      </div>
      <button
        type="button"
        onClick={() => onExport('png')}
        disabled={isExporting}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all active:scale-[0.98] disabled:opacity-50"
        title="Export graph as PNG"
      >
        <Download className="h-3 w-3 text-zinc-400" />
        <span>{isExporting && exportFormat === 'png' ? '...' : 'PNG'}</span>
      </button>
      <button
        type="button"
        onClick={() => onExport('pdf')}
        disabled={isExporting}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all active:scale-[0.98] disabled:opacity-50"
        title="Export graph as PDF"
      >
        <Download className="h-3 w-3 text-zinc-400" />
        <span>{isExporting && exportFormat === 'pdf' ? '...' : 'PDF'}</span>
      </button>
    </div>
  );
}
