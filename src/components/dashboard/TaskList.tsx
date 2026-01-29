import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

const tasks: Task[] = [
  {
    id: '1',
    title: 'Follow up with Sarah Chen',
    dueDate: 'Today',
    priority: 'high',
    completed: false,
  },
  {
    id: '2',
    title: 'Send investment memo to Searchlight',
    dueDate: 'Today',
    priority: 'high',
    completed: false,
  },
  {
    id: '3',
    title: 'Review Precision Mfg financials',
    dueDate: 'Tomorrow',
    priority: 'medium',
    completed: false,
  },
  {
    id: '4',
    title: 'Schedule call with HomeHealth',
    dueDate: 'This week',
    priority: 'medium',
    completed: false,
  },
  {
    id: '5',
    title: 'Update investor deck',
    dueDate: 'This week',
    priority: 'low',
    completed: true,
  },
];

const priorityColors = {
  high: 'text-destructive',
  medium: 'text-warning',
  low: 'text-muted-foreground',
};

export function TaskList() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-foreground">Upcoming Tasks</h3>
        <span className="text-xs text-muted-foreground">
          {tasks.filter((t) => !t.completed).length} pending
        </span>
      </div>

      <div className="space-y-3">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 cursor-pointer animate-slide-up',
              task.completed && 'opacity-50'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <button className="mt-0.5">
              {task.completed ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium',
                  task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                )}
              >
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{task.dueDate}</span>
                {task.priority === 'high' && !task.completed && (
                  <AlertCircle className={cn('w-3 h-3', priorityColors[task.priority])} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
