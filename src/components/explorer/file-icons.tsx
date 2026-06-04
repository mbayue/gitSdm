import {
  FileCode2,
  FileJson,
  FileText,
  Lock,
  Box,
  Folder,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileIconProps {
  name: string;
  className?: string;
}

function getFileIconSpec(name: string): { Icon: LucideIcon; className: string } {
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
  if (open) {
    return <FolderOpen className={cn('h-4 w-4 shrink-0 text-violet-400 dark:text-violet-400/90', className)} />;
  }
  return <Folder className={cn('h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500/80', className)} />;
}
