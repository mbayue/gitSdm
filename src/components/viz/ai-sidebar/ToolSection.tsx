import React from 'react';

interface ToolSectionProps {
  title: string;
  children: React.ReactNode;
}

export function ToolSection({ title, children }: ToolSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          {title}
        </h4>
        <div className="h-px flex-1 bg-white/[0.03] ml-3" />
      </div>
      {children}
    </div>
  );
}
