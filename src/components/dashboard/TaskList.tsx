import { CheckCircle2, Circle, Clock, AlertCircle, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasks, useToggleTaskComplete, useCreateTask, Task } from '@/hooks/useTasks';
import { format, isToday, isTomorrow, isThisWeek, isPast } from 'date-fns';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const priorityColors = {
  high: 'text-destructive',
  medium: 'text-warning',
  low: 'text-muted-foreground',
};

export function TaskList() {
  const { data: tasks = [], isLoading } = useTasks();
  const toggleComplete = useToggleTaskComplete();
  const createTask = useCreateTask();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const formatDueDate = (date: string | null) => {
    if (!date) return 'No due date';
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    if (isThisWeek(d)) return format(d, 'EEEE');
    return format(d, 'MMM d');
  };

  const handleToggle = async (task: Task) => {
    try {
      await toggleComplete.mutateAsync({ id: task.id, completed: !task.completed });
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await createTask.mutateAsync({
        title: newTaskTitle.trim(),
        priority: 'medium',
      });
      setNewTaskTitle('');
      setIsAdding(false);
      toast.success('Task added');
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  // Sort tasks: incomplete first, then by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  }).slice(0, 5);

  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-in shadow-card">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-foreground">Upcoming Tasks</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{pendingCount} pending</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick add task */}
      {isAdding && (
        <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a quick task..."
            className="flex-1"
            autoFocus
          />
          <Button type="submit" size="sm" disabled={createTask.isPending}>
            {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
          </Button>
        </form>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
              <div className="w-5 h-5 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && tasks.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No tasks yet</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add your first task
          </Button>
        </div>
      )}

      {!isLoading && sortedTasks.length > 0 && (
        <div className="space-y-3">
          {sortedTasks.map((task, index) => {
            const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !task.completed;
            return (
              <div
                key={task.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 cursor-pointer animate-slide-up',
                  task.completed && 'opacity-50'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleToggle(task)}
              >
                <button className="mt-0.5" disabled={toggleComplete.isPending}>
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
                    <Clock className={cn('w-3 h-3', isOverdue ? 'text-destructive' : 'text-muted-foreground')} />
                    <span className={cn('text-xs', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                      {formatDueDate(task.due_date)}
                    </span>
                    {task.priority === 'high' && !task.completed && (
                      <AlertCircle className={cn('w-3 h-3', priorityColors.high)} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
