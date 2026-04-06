import { useState, useMemo } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { isToday, isFuture, isPast, startOfDay, addDays, addWeeks, addMonths } from 'date-fns';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskRow } from '@/components/tasks/TaskRow';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { DeleteTaskDialog } from '@/components/tasks/DeleteTaskDialog';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useToggleTaskComplete, Task } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useAppMode } from '@/hooks/useAppMode';

type TabValue = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

export default function Tasks() {
  const { data: allTasks = [], isLoading } = useTasks();
  const { mode } = useAppMode();

  // Filter tasks by mode: fundraising shows investor-linked tasks, deal sourcing shows deal/company-linked tasks
  const tasks = useMemo(() => {
    return allTasks.filter(t => {
      if (mode === 'fundraising') {
        // Show tasks linked to investors, or unlinked tasks (no company and no investor)
        return !!t.investor_deal_id || (!t.company_id && !t.investor_deal_id);
      } else {
        // Show tasks linked to companies/deals, or unlinked tasks
        return !!t.company_id || (!t.company_id && !t.investor_deal_id);
      }
    });
  }, [allTasks, mode]);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleComplete = useToggleTaskComplete();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<TabValue>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const filtered = useMemo(() => {
    const today = startOfDay(new Date());
    switch (tab) {
      case 'today':
        return tasks.filter((t) => t.due_date && isToday(new Date(t.due_date)) && !t.completed);
      case 'upcoming':
        return tasks.filter((t) => t.due_date && isFuture(new Date(t.due_date)) && !t.completed);
      case 'overdue':
        return tasks.filter((t) => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && !t.completed);
      case 'completed':
        return tasks.filter((t) => t.completed);
      default:
        return tasks;
    }
  }, [tasks, tab]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    const task = tasks.find((t) => t.id === id);
    await toggleComplete.mutateAsync({ id, completed });

    // Handle recurring task
    if (completed && task && task.recurrence) {
      const recurrence = task.recurrence;
      const baseDue = task.due_date ? new Date(task.due_date) : new Date();
      let nextDue: Date;
      if (recurrence === 'daily') nextDue = addDays(baseDue, 1);
      else if (recurrence === 'weekly') nextDue = addWeeks(baseDue, 1);
      else nextDue = addMonths(baseDue, 1);

      await createTask.mutateAsync({
        title: task.title,
        description: task.description,
        priority: task.priority,
        due_date: nextDue.toISOString().split('T')[0],
        contact_id: task.contact_id,
        company_id: task.company_id,
        investor_deal_id: task.investor_deal_id,
        recurrence,
      } as any);
      toast({ title: 'Recurring task created', description: `Next due ${nextDue.toLocaleDateString()}` });
    }
  };

  const handleSubmit = async (data: any) => {
    if (data.id) {
      await updateTask.mutateAsync(data);
      toast({ title: 'Task updated' });
    } else {
      await createTask.mutateAsync(data);
      toast({ title: 'Task created' });
    }
    setEditingTask(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTask.mutateAsync(deleteId);
      toast({ title: 'Task deleted' });
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    for (const id of selected) {
      await deleteTask.mutateAsync(id);
    }
    toast({ title: `${selected.size} tasks deleted` });
    setSelected(new Set());
    setBulkDeleteOpen(false);
  };

  const handleBulkComplete = async () => {
    for (const id of selected) {
      await toggleComplete.mutateAsync({ id, completed: true });
    }
    toast({ title: `${selected.size} tasks completed` });
    setSelected(new Set());
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Follow-ups"
        description={mode === 'fundraising' ? 'Manage investor follow-ups and reminders' : 'Manage deal tasks, diligence items, and follow-ups'}
        actions={
          <Button onClick={() => { setEditingTask(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> New Task
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <TabsList>
            <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <Button variant="outline" size="sm" onClick={handleBulkComplete}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete
            </Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-muted-foreground text-sm">Loading tasks...</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-muted-foreground text-sm">No tasks here yet.</p>
        ) : (
          filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              selected={selected.has(task.id)}
              onToggleSelect={toggleSelect}
              onToggleComplete={handleToggleComplete}
              onEdit={(t) => { setEditingTask(t); setFormOpen(true); }}
              onDelete={(id) => setDeleteId(id)}
            />
          ))
        )}
      </div>

      <TaskFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        task={editingTask}
      />

      <DeleteTaskDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={handleDelete}
      />

      <DeleteTaskDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        count={selected.size}
      />
    </div>
  );
}
