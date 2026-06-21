import React from 'react';

interface ToolSectionProps {
  title: string;
  children: React.ReactNode;
}

export function ToolSection({ title, children }: ToolSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">
          {title}
        </h4>
        <div className="h-px flex-1 bg-[rgba(240,246,252,0.1)] ml-3" />
      </div>
      {children}
    </div>
  );
}
