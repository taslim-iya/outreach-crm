import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  title: string;
  count: number;
  color: string;
  children: ReactNode;
}

export function KanbanColumn({ title, count, color, children }: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[290px] max-w-[290px] h-full">
      {/* Column Header */}
      <div className="flex items-center gap-2.5 px-3 py-3 mb-2 rounded-lg bg-muted/40">
        <div className={cn('w-2.5 h-2.5 rounded-full ring-2 ring-background', color)} />
        <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
        <span className="ml-auto text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
          {count}
        </span>
      </div>

      {/* Column Content */}
      <div className="flex-1 space-y-2.5 overflow-y-auto px-0.5 pb-4 scrollbar-thin">
        {children}
      </div>
    </div>
  );
}
