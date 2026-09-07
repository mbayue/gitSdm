import { AlertCircle } from 'lucide-react';

export function LoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2" role="status">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent text-foreground" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 justify-center py-6 text-xs text-destructive px-2 text-center" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyRow({ label }: { label: string }) {
  return <div className="py-6 text-center text-xs text-muted-foreground">{label}</div>;
}
