import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContacts } from '@/hooks/useContacts';
import { useCompanies } from '@/hooks/useCompanies';
import { useInvestorDeals } from '@/hooks/useInvestorDeals';
import { Task } from '@/hooks/useTasks';

interface TaskFormData {
  title: string;
  description: string;
  priority: string;
  due_date: string;
  contact_id: string;
  company_id: string;
  investor_deal_id: string;
  recurrence: string;
}

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  task?: Task | null;
}

export function TaskFormModal({ open, onOpenChange, onSubmit, task }: TaskFormModalProps) {
  const { data: contacts = [] } = useContacts();
  const { data: companies = [] } = useCompanies();
  const { data: investors = [] } = useInvestorDeals();

  const { register, handleSubmit, reset, setValue, watch } = useForm<TaskFormData>({
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      contact_id: '',
      company_id: '',
      investor_deal_id: '',
      recurrence: '',
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: (task as any).description || '',
        priority: task.priority || 'medium',
        due_date: task.due_date || '',
        contact_id: task.contact_id || '',
        company_id: task.company_id || '',
        investor_deal_id: (task as any).investor_deal_id || '',
        recurrence: (task as any).recurrence || '',
      });
    } else {
      reset({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        contact_id: '',
        company_id: '',
        investor_deal_id: '',
        recurrence: '',
      });
    }
  }, [task, open, reset]);

  const onFormSubmit = (data: TaskFormData) => {
    const cleaned = {
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      due_date: data.due_date || null,
      contact_id: data.contact_id === 'none' ? null : data.contact_id || null,
      company_id: data.company_id === 'none' ? null : data.company_id || null,
      investor_deal_id: data.investor_deal_id === 'none' ? null : data.investor_deal_id || null,
      recurrence: data.recurrence === 'none' ? null : data.recurrence || null,
    };
    onSubmit(task ? { ...cleaned, id: task.id } : cleaned);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title', { required: true })} placeholder="Task title" />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} placeholder="Optional details..." rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select value={watch('priority')} onValueChange={(v) => setValue('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input id="due_date" type="date" {...register('due_date')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Recurrence</Label>
              <Select value={watch('recurrence')} onValueChange={(v) => setValue('recurrence', v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contact</Label>
              <Select value={watch('contact_id')} onValueChange={(v) => setValue('contact_id', v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Company</Label>
              <Select value={watch('company_id')} onValueChange={(v) => setValue('company_id', v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Investor</Label>
              <Select value={watch('investor_deal_id')} onValueChange={(v) => setValue('investor_deal_id', v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {investors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{task ? 'Save' : 'Create Task'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
