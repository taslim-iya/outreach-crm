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
    <div className="flex flex-col min-w-[280px] max-w-[280px] h-full">
      {/* Column Header */}
      <div className="flex items-center gap-2 px-3 py-3 mb-3">
        <div className={cn('w-2 h-2 rounded-full', color)} />
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>

      {/* Column Content */}
      <div className="flex-1 space-y-2 overflow-y-auto px-1 pb-4">
        {children}
      </div>
    </div>
  );
}
