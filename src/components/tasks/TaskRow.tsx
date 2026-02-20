import { format } from 'date-fns';
import { CheckCircle2, Circle, Trash2, Pencil, RotateCw, User, Building2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/hooks/useTasks';

interface TaskRowProps {
  task: Task;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityColors: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  low: 'bg-muted text-muted-foreground border-border',
};

export function TaskRow({ task, selected, onToggleSelect, onToggleComplete, onEdit, onDelete }: TaskRowProps) {
  const isOverdue = task.due_date && !task.completed && new Date(task.due_date) < new Date();

  const linkedEntities = [
    task.contacts && { icon: User, label: task.contacts.name, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
    task.companies && { icon: Building2, label: task.companies.name, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
    task.investor_deals && {
      icon: TrendingUp,
      label: task.investor_deals.organization
        ? `${task.investor_deals.name} · ${task.investor_deals.organization}`
        : task.investor_deals.name,
      color: 'text-purple-600 bg-purple-500/10 border-purple-500/20',
    },
  ].filter(Boolean) as { icon: typeof User; label: string; color: string }[];

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-accent/30 transition-colors group',
        task.completed && 'opacity-60',
      )}
    >
      <Checkbox checked={selected} onCheckedChange={() => onToggleSelect(task.id)} className="shrink-0" />

      <button
        onClick={() => onToggleComplete(task.id, !task.completed)}
        className="shrink-0"
      >
        {task.completed ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(task)}>
        <p className={cn('text-sm font-medium text-foreground truncate', task.completed && 'line-through')}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>
        )}
        {linkedEntities.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {linkedEntities.map((entity) => {
              const Icon = entity.icon;
              return (
                <span
                  key={entity.label}
                  className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border', entity.color)}
                >
                  <Icon className="h-3 w-3" />
                  {entity.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {task.recurrence && (
          <RotateCw className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        {task.priority && (
          <Badge variant="outline" className={cn('text-[10px] capitalize', priorityColors[task.priority])}>
            {task.priority}
          </Badge>
        )}
        {task.due_date && (
          <span className={cn('text-xs whitespace-nowrap', isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
            {format(new Date(task.due_date), 'MMM d')}
          </span>
        )}
        <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(task.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
