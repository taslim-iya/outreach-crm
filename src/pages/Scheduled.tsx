import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useScheduledCommunications, useUpdateScheduledCommunication, useDeleteScheduledCommunication, ScheduledCommunication } from '@/hooks/useScheduledCommunications';
import { ScheduleFormModal } from '@/components/scheduled/ScheduleFormModal';
import { Plus, CalendarClock, Send, Edit, Trash2, Bell, RotateCcw, Loader2 } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';
import { cn } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  follow_up: 'Follow-Up',
  monthly_update: 'Monthly Update',
  quarterly_update: 'Quarterly Update',
  investor_update: 'Investor Update',
  pipeline_report: 'Pipeline Report',
  check_in: 'Check-In',
  custom: 'Custom',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  ready_to_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  sent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-muted text-muted-foreground',
};

export default function Scheduled() {
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ScheduledCommunication | null>(null);
  const { data: items, isLoading } = useScheduledCommunications();
  const updateMutation = useUpdateScheduledCommunication();
  const deleteMutation = useDeleteScheduledCommunication();

  const pending = items?.filter(i => ['pending', 'ready_to_review'].includes(i.status)) || [];
  const sent = items?.filter(i => i.status === 'sent') || [];
  const recurring = items?.filter(i => i.recurrence !== 'none') || [];

  const handleEdit = (item: ScheduledCommunication) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const handleMarkSent = (id: string) => {
    updateMutation.mutate({ id, status: 'sent', last_sent_at: new Date().toISOString() });
  };

  const handleCancel = (id: string) => {
    updateMutation.mutate({ id, status: 'cancelled' });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const renderItem = (item: ScheduledCommunication) => {
    const isOverdue = isPast(new Date(item.scheduled_for)) && item.status === 'pending';
    return (
      <Card key={item.id} className={cn('transition-all', isOverdue && 'border-destructive/50')}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">{item.title}</h3>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {TYPE_LABELS[item.type] || item.type}
                </Badge>
                <Badge className={cn('text-[10px] shrink-0', STATUS_STYLES[item.status] || '')}>
                  {item.status === 'ready_to_review' ? 'Review' : item.status}
                </Badge>
                {item.auto_send && (
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    <Send className="w-2.5 h-2.5 mr-1" />Auto
                  </Badge>
                )}
                {!item.auto_send && item.status === 'pending' && (
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    <Bell className="w-2.5 h-2.5 mr-1" />Notify
                  </Badge>
                )}
                {item.recurrence !== 'none' && (
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    <RotateCcw className="w-2.5 h-2.5 mr-1" />{item.recurrence}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {isOverdue ? (
                  <span className="text-destructive font-medium">Overdue — </span>
                ) : null}
                Scheduled: {format(new Date(item.scheduled_for), 'MMM d, yyyy h:mm a')}
              </p>
              {item.content && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {item.status !== 'sent' && item.status !== 'cancelled' && (
                <>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(item)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMarkSent(item.id)}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleCancel(item.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
              {(item.status === 'sent' || item.status === 'cancelled') && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <PageHeader
        title="Scheduled"
        description="Manage follow-ups, investor updates, and recurring communications"
        actions={
          <Button size="sm" onClick={() => { setEditItem(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule New
          </Button>
        }
      />

      <Tabs defaultValue="upcoming" className="mt-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming {pending.length > 0 && `(${pending.length})`}
          </TabsTrigger>
          <TabsTrigger value="recurring">
            Recurring {recurring.length > 0 && `(${recurring.length})`}
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent {sent.length > 0 && `(${sent.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No upcoming items</p>
              <p className="text-sm mt-1">Schedule follow-ups, investor updates, and more</p>
            </div>
          ) : (
            pending.map(renderItem)
          )}
        </TabsContent>

        <TabsContent value="recurring" className="mt-4 space-y-3">
          {recurring.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RotateCcw className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No recurring items</p>
              <p className="text-sm mt-1">Set up monthly or quarterly investor updates</p>
            </div>
          ) : (
            recurring.map(renderItem)
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-4 space-y-3">
          {sent.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Send className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No sent items yet</p>
            </div>
          ) : (
            sent.map(renderItem)
          )}
        </TabsContent>
      </Tabs>

      <ScheduleFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
      />
    </div>
  );
}
