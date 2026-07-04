import { AlertCircle } from 'lucide-react';

export function LoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-6 text-xs text-zinc-500 gap-2">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent text-[#e6edf3]" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 justify-center py-6 text-xs text-red-400 px-2 text-center">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyRow({ label }: { label: string }) {
  return <div className="py-6 text-center text-xs text-zinc-500">{label}</div>;
}
