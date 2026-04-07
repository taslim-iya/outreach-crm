import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface EmailAnalytics {
  totalSent: number;
  totalReceived: number;
  totalOpened: number;
  openRate: number;
  emailsByDay: { date: string; sent: number; received: number; opened: number }[];
  topRecipients: { email: string; count: number; opens: number }[];
}

export function useEmailAnalytics(days = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['email_analytics', user?.id, days],
    queryFn: async (): Promise<EmailAnalytics> => {
      if (!user) throw new Error('Not authenticated');
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data: emails, error } = await supabase
        .from('emails')
        .select('id, direction, to_emails, from_email, received_at, open_count, first_opened_at')
        .eq('user_id', user.id)
        .gte('received_at', since.toISOString())
        .order('received_at', { ascending: true });

      if (error) throw error;
      const allEmails = emails || [];

      const sent = allEmails.filter(e => e.direction === 'outbound');
      const received = allEmails.filter(e => e.direction === 'inbound');
      const opened = sent.filter(e => (e.open_count || 0) > 0);

      // Group by day
      const dayMap: Record<string, { sent: number; received: number; opened: number }> = {};
      for (const e of allEmails) {
        const date = e.received_at ? e.received_at.split('T')[0] : 'unknown';
        if (!dayMap[date]) dayMap[date] = { sent: 0, received: 0, opened: 0 };
        if (e.direction === 'outbound') {
          dayMap[date].sent++;
          if ((e.open_count || 0) > 0) dayMap[date].opened++;
        } else {
          dayMap[date].received++;
        }
      }

      // Top recipients
      const recipientMap: Record<string, { count: number; opens: number }> = {};
      for (const e of sent) {
        const to = e.to_emails?.[0] || 'unknown';
        if (!recipientMap[to]) recipientMap[to] = { count: 0, opens: 0 };
        recipientMap[to].count++;
        if ((e.open_count || 0) > 0) recipientMap[to].opens++;
      }

      return {
        totalSent: sent.length,
        totalReceived: received.length,
        totalOpened: opened.length,
        openRate: sent.length > 0 ? Math.round((opened.length / sent.length) * 100) : 0,
        emailsByDay: Object.entries(dayMap).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date)),
        topRecipients: Object.entries(recipientMap)
          .map(([email, v]) => ({ email, ...v }))
          .sort((a, b) => b.count - a.count),
      };
    },
    enabled: !!user,
  });
}
