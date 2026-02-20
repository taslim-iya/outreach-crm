import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Droppable } from '@hello-pangea/dnd';

interface KanbanColumnProps {
  title: string;
  count: number;
  color: string;
  droppableId?: string;
  children: ReactNode;
}

export function KanbanColumn({ title, count, color, droppableId, children }: KanbanColumnProps) {
  const content = droppableId ? (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            'flex-1 space-y-2.5 overflow-y-auto px-0.5 pb-4 rounded-lg transition-colors duration-200',
            snapshot.isDraggingOver && 'bg-primary/5 ring-1 ring-primary/20'
          )}
        >
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  ) : (
    <div className="flex-1 space-y-2.5 overflow-y-auto px-0.5 pb-4">
      {children}
    </div>
  );

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

      {content}
    </div>
  );
}
