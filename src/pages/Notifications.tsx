import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications, NotificationType } from '@/hooks/useNotifications';
import { useToggleTaskComplete } from '@/hooks/useTasks';
import { CheckCircle2, Users, TrendingUp, Bell, ArrowRight } from 'lucide-react';

const iconMap: Record<NotificationType, typeof Bell> = {
  overdue_task: CheckCircle2,
  stale_contact: Users,
  stale_investor: TrendingUp,
};

const labelMap: Record<NotificationType, string> = {
  overdue_task: 'Overdue Tasks',
  stale_contact: 'Stale Contacts',
  stale_investor: 'Investors Need Follow-Up',
};

const colorMap: Record<NotificationType, string> = {
  overdue_task: 'text-destructive',
  stale_contact: 'text-amber-500',
  stale_investor: 'text-primary',
};

export default function Notifications() {
  const { data: notifications = [] } = useNotifications();
  const toggleComplete = useToggleTaskComplete();
  const navigate = useNavigate();

  const grouped = notifications.reduce(
    (acc, n) => {
      (acc[n.type] ??= []).push(n);
      return acc;
    },
    {} as Record<NotificationType, typeof notifications>,
  );

  const handleClick = (n: (typeof notifications)[0]) => {
    if (n.type === 'overdue_task') navigate('/tasks');
    else if (n.type === 'stale_contact') navigate('/contacts');
    else navigate('/investors');
  };

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Notifications"
        description={`${notifications.length} items need your attention`}
      />

      {notifications.length === 0 ? (
        <Card className="mt-6 p-12 flex flex-col items-center justify-center text-center">
          <Bell className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">You're all caught up!</h3>
          <p className="text-sm text-muted-foreground mt-1">No overdue tasks, stale contacts, or pending follow-ups.</p>
        </Card>
      ) : (
        <div className="mt-6 space-y-6">
          {(Object.entries(grouped) as [NotificationType, typeof notifications][]).map(([type, items]) => {
            const Icon = iconMap[type];
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 ${colorMap[type]}`} />
                  <h2 className="text-sm font-semibold text-foreground">{labelMap[type]}</h2>
                  <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map((n) => (
                    <Card
                      key={n.id}
                      className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:border-primary/30 transition-colors"
                      onClick={() => handleClick(n)}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${colorMap[type]}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                        {n.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">{n.subtitle}</p>
                        )}
                      </div>
                      {n.type === 'overdue_task' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComplete.mutate({ id: n.entityId, completed: true });
                          }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Done
                        </Button>
                      )}
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
