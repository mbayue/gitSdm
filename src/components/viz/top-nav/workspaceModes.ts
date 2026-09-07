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
    description: 'Show the file explorer and repository insights',
    icon: LayoutPanelLeft,
    color: 'text-foreground',
    bgColor: 'bg-secondary border-border text-foreground',
  },
  {
    id: 'focus',
    label: 'Focus Mode',
    description: 'Minimizes sidebars to focus purely on the canvas',
    icon: Monitor,
    color: 'text-foreground',
    bgColor: 'bg-secondary border-border text-foreground',
  },
  {
    id: 'analysis',
    label: 'Analysis Mode',
    description: 'Inspect file details and relationships',
    icon: ActivitySquare,
    color: 'text-foreground',
    bgColor: 'bg-secondary border-border text-foreground',
  },
  {
    id: 'learning',
    label: 'Learning Mode',
    description: 'Follow a guided reading path through the codebase',
    icon: BookOpen,
    color: 'text-foreground',
    bgColor: 'bg-secondary border-border text-foreground',
  },
];

export const LAYOUT_MODE_IDS = ['full', 'focus', 'analysis', 'learning'] as const;
export type WorkspaceModeId = (typeof LAYOUT_MODE_IDS)[number];
