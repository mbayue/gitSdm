import {
  FileCode2,
  FileJson,
  FileText,
  Lock,
  Box,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileIconProps {
  name: string;
  className?: string;
}

export function getFileIconSpec(name: string): { Icon: LucideIcon; className: string } {
  const lower = name.toLowerCase();
  if (lower.endsWith('.json') || lower.endsWith('.lock') || lower.includes('lock'))
    return { Icon: FileJson, className: 'text-amber-400' };
  if (lower.endsWith('.yml') || lower.endsWith('.yaml'))
    return { Icon: FileCode2, className: 'text-amber-300' };
  if (lower.endsWith('.html') || lower.endsWith('.htm'))
    return { Icon: FileCode2, className: 'text-rose-400' };
  if (lower.endsWith('.css'))
    return { Icon: FileCode2, className: 'text-sky-400' };
  if (lower.endsWith('.md'))
    return { Icon: FileText, className: 'text-sky-300' };
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.svg'))
    return { Icon: FileText, className: 'text-violet-400' };
  if (lower.includes('dockerfile') || lower.endsWith('.dockerfile'))
    return { Icon: Box, className: 'text-blue-400' };
  if (lower.endsWith('.ts') || lower.endsWith('.tsx'))
    return { Icon: FileCode2, className: 'text-blue-400' };
  if (lower.endsWith('.js') || lower.endsWith('.jsx'))
    return { Icon: FileCode2, className: 'text-yellow-400' };
  if (lower.endsWith('.py'))
    return { Icon: FileCode2, className: 'text-emerald-400' };
  if (lower.endsWith('.go'))
    return { Icon: FileCode2, className: 'text-cyan-400' };
  if (lower.endsWith('.rs'))
    return { Icon: FileCode2, className: 'text-orange-400' };
  if (lower.endsWith('.toml') || lower.endsWith('.env'))
    return { Icon: Lock, className: 'text-zinc-400' };
  return { Icon: FileCode2, className: 'text-zinc-400' };
}

export function FileTypeIcon({ name, className }: FileIconProps) {
  const { Icon, className: color } = getFileIconSpec(name);
  return <Icon className={cn('h-4 w-4 shrink-0', color, className)} />;
}

export function FolderIcon({ open, className }: { open?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('h-4 w-4 shrink-0', className)}
      fill="currentColor"
    >
      {open ? (
        <path
          className="text-fuchsia-400"
          d="M1.5 3.5A1 1 0 0 1 2.5 2.5h3.172a1 1 0 0 1 .707.293L7.914 4H13.5a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V3.5z"
        />
      ) : (
        <path
          className="text-fuchsia-400/90"
          d="M1.5 3.5A1 1 0 0 1 2.5 2.5h3.172a1 1 0 0 1 .707.293L7.914 4H13.5a1 1 0 0 1 1 1v1H1.5V3.5z"
        />
      )}
    </svg>
  );
}
