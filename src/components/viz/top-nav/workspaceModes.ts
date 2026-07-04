import { LayoutPanelLeft, Monitor, ActivitySquare, BookOpen } from 'lucide-react';

export interface WorkspaceMode {
  id: 'full' | 'focus' | 'analysis' | 'learning';
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export const WORKSPACE_MODES: WorkspaceMode[] = [
  {
    id: 'full',
    label: 'Full Workspace',
    description: 'All panels, file explorer, and inspector visible',
    icon: LayoutPanelLeft,
    color: 'text-[#e6edf3]',
    bgColor: 'bg-white/5 border-white/10 text-[#e6edf3]',
  },
  {
    id: 'focus',
    label: 'Focus Mode',
    description: 'Minimizes sidebars to focus purely on the canvas',
    icon: Monitor,
    color: 'text-[#e6edf3]',
    bgColor: 'bg-white/5 border-white/10 text-[#e6edf3]',
  },
  {
    id: 'analysis',
    label: 'Analysis Mode',
    description: 'Focuses sidebar on AI analysis and insights',
    icon: ActivitySquare,
    color: 'text-[#e6edf3]',
    bgColor: 'bg-white/5 border-white/10 text-[#e6edf3]',
  },
  {
    id: 'learning',
    label: 'Learning Mode',
    description: 'Walk through codebase concepts with timelines',
    icon: BookOpen,
    color: 'text-[#e6edf3]',
    bgColor: 'bg-white/5 border-white/10 text-[#e6edf3]',
  },
];

export const LAYOUT_MODE_IDS = ['full', 'focus', 'analysis', 'learning'] as const;
export type WorkspaceModeId = (typeof LAYOUT_MODE_IDS)[number];