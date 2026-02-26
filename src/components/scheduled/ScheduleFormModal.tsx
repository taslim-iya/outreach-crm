import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateScheduledCommunication, useUpdateScheduledCommunication, ScheduledCommunication } from '@/hooks/useScheduledCommunications';
import { Loader2, CalendarClock } from 'lucide-react';

interface ScheduleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: ScheduledCommunication | null;
}

export function ScheduleFormModal({ open, onOpenChange, editItem }: ScheduleFormModalProps) {
  const [type, setType] = useState(editItem?.type || 'follow_up');
  const [title, setTitle] = useState(editItem?.title || '');
  const [content, setContent] = useState(editItem?.content || '');
  const [scheduledFor, setScheduledFor] = useState(
    editItem?.scheduled_for ? new Date(editItem.scheduled_for).toISOString().slice(0, 16) : ''
  );
  const [recurrence, setRecurrence] = useState(editItem?.recurrence || 'none');
  const [autoSend, setAutoSend] = useState(editItem?.auto_send || false);

  const createMutation = useCreateScheduledCommunication();
  const updateMutation = useUpdateScheduledCommunication();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !scheduledFor) return;

    const payload = {
      type,
      title,
      content: content || null,
      recipient_type: type.includes('update') ? 'investor_deal' : 'contact',
      recipient_ids: [],
      scheduled_for: new Date(scheduledFor).toISOString(),
      recurrence,
      auto_send: autoSend,
      status: 'pending' as string,
    };

    if (editItem) {
      await updateMutation.mutateAsync({ id: editItem.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setType('follow_up');
    setTitle('');
    setContent('');
    setScheduledFor('');
    setRecurrence('none');
    setAutoSend(false);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            {editItem ? 'Edit Scheduled Item' : 'Schedule Communication'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="follow_up">Follow-Up</SelectItem>
                <SelectItem value="monthly_update">Monthly Investor Update</SelectItem>
                <SelectItem value="quarterly_update">Quarterly Investor Update</SelectItem>
                <SelectItem value="investor_update">Investor Update (One-time)</SelectItem>
                <SelectItem value="pipeline_report">Pipeline Report</SelectItem>
                <SelectItem value="check_in">Check-In Email</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5"
              placeholder="e.g. Q1 2026 Investor Update"
              required
            />
          </div>

          <div>
            <Label>Content / Notes</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1.5"
              rows={4}
              placeholder="Draft content or notes for this communication..."
            />
          </div>

          <div>
            <Label>Scheduled Date & Time</Label>
            <Input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label>Recurrence</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">One-time</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Auto-send</p>
              <p className="text-xs text-muted-foreground">
                {autoSend ? 'Will send automatically at scheduled time' : 'You\'ll be notified to review before sending'}
              </p>
            </div>
            <Switch checked={autoSend} onCheckedChange={setAutoSend} />
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {editItem ? 'Update Schedule' : 'Schedule'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
