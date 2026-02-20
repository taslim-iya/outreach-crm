import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { subDays, startOfDay } from 'date-fns';

export type NotificationType = 'overdue_task' | 'stale_contact' | 'stale_investor';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  subtitle?: string;
  entityId: string;
  urgency: number; // higher = more urgent
}

export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!user) return [];

      const today = startOfDay(new Date()).toISOString();
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const fiveDaysAgo = subDays(new Date(), 5).toISOString();

      const [tasksRes, contactsRes, investorsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, due_date, priority, contacts(name), companies(name), investor_deals(name)')
          .eq('completed', false)
          .lt('due_date', today)
          .order('due_date', { ascending: true }),
        supabase
          .from('contacts')
          .select('id, name, last_interaction_at')
          .or(`last_interaction_at.lt.${sevenDaysAgo},last_interaction_at.is.null`),
        supabase
          .from('investor_deals')
          .select('id, name, stage, updated_at')
          .in('stage', ['outreach_sent', 'follow_up', 'meeting_scheduled'])
          .lt('updated_at', fiveDaysAgo),
      ]);

      const notifications: Notification[] = [];

      (tasksRes.data ?? []).forEach((t: any) => {
        const linked = [
          t.contacts?.name,
          t.companies?.name,
          t.investor_deals?.name,
        ].filter(Boolean);
        const subtitleParts = [`Due ${t.due_date}`];
        if (linked.length) subtitleParts.push(linked.join(' · '));

        notifications.push({
          id: `task-${t.id}`,
          type: 'overdue_task',
          title: t.title,
          subtitle: subtitleParts.join(' — '),
          entityId: t.id,
          urgency: t.priority === 'high' ? 3 : t.priority === 'medium' ? 2 : 1,
        });
      });

      (contactsRes.data ?? []).forEach((c) => {
        notifications.push({
          id: `contact-${c.id}`,
          type: 'stale_contact',
          title: c.name,
          subtitle: c.last_interaction_at
            ? `Last contact ${new Date(c.last_interaction_at).toLocaleDateString()}`
            : 'Never contacted',
          entityId: c.id,
          urgency: c.last_interaction_at ? 1 : 2,
        });
      });

      (investorsRes.data ?? []).forEach((i) => {
        notifications.push({
          id: `investor-${i.id}`,
          type: 'stale_investor',
          title: i.name,
          subtitle: `In ${i.stage.replace(/_/g, ' ')} — no activity`,
          entityId: i.id,
          urgency: 2,
        });
      });

      return notifications.sort((a, b) => b.urgency - a.urgency);
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });
}
