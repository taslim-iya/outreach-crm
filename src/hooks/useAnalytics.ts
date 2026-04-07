import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PipelineAnalytics {
  investorsByStage: { stage: string; count: number }[];
  dealsByStage: { stage: string; count: number }[];
  totalInvestors: number;
  totalDeals: number;
  totalCommitted: number;
  conversionRate: number;
}

interface EmailAnalyticsData {
  totalSent: number;
  totalOpened: number;
  totalReplied: number;
  totalBounced: number;
  openRate: number;
  replyRate: number;
  bounceRate: number;
  dailyStats: { date: string; sent: number; opened: number; replied: number }[];
}

interface ActivityAnalytics {
  totalContacts: number;
  newContactsThisMonth: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  totalNotes: number;
  totalDocuments: number;
  recentActivities: { date: string; count: number }[];
}

export function usePipelineAnalytics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pipeline-analytics', user?.id],
    queryFn: async (): Promise<PipelineAnalytics> => {
      if (!user) return { investorsByStage: [], dealsByStage: [], totalInvestors: 0, totalDeals: 0, totalCommitted: 0, conversionRate: 0 };

      const [investorResult, dealsResult] = await Promise.all([
        supabase.from('investor_deals').select('stage, commitment_amount').eq('user_id', user.id),
        supabase.from('companies').select('stage').eq('user_id', user.id),
      ]);

      const investors = investorResult.data || [];
      const deals = dealsResult.data || [];

      // Group investors by stage
      const investorStageMap: Record<string, number> = {};
      let totalCommitted = 0;
      investors.forEach(inv => {
        investorStageMap[inv.stage] = (investorStageMap[inv.stage] || 0) + 1;
        if (inv.stage === 'committed' || inv.stage === 'closed') {
          totalCommitted += inv.commitment_amount || 0;
        }
      });

      // Group deals by stage
      const dealStageMap: Record<string, number> = {};
      deals.forEach(d => {
        dealStageMap[d.stage] = (dealStageMap[d.stage] || 0) + 1;
      });

      const closed = investors.filter(i => i.stage === 'closed').length;
      const conversionRate = investors.length > 0 ? Math.round((closed / investors.length) * 100) : 0;

      return {
        investorsByStage: Object.entries(investorStageMap).map(([stage, count]) => ({ stage, count })),
        dealsByStage: Object.entries(dealStageMap).map(([stage, count]) => ({ stage, count })),
        totalInvestors: investors.length,
        totalDeals: deals.length,
        totalCommitted,
        conversionRate,
      };
    },
    enabled: !!user,
  });
}

export function useEmailAnalyticsDetailed(days = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['email-analytics-detailed', user?.id, days],
    queryFn: async (): Promise<EmailAnalyticsData> => {
      if (!user) return { totalSent: 0, totalOpened: 0, totalReplied: 0, totalBounced: 0, openRate: 0, replyRate: 0, bounceRate: 0, dailyStats: [] };

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: emails } = await supabase
        .from('emails')
        .select('direction, open_count, received_at, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      const allEmails = emails || [];
      const sent = allEmails.filter(e => e.direction === 'outbound');
      const received = allEmails.filter(e => e.direction === 'inbound');
      const opened = sent.filter(e => (e.open_count || 0) > 0);

      // Daily stats
      const dailyMap: Record<string, { sent: number; opened: number; replied: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dailyMap[key] = { sent: 0, opened: 0, replied: 0 };
      }

      sent.forEach(e => {
        const day = (e.created_at || '').split('T')[0];
        if (dailyMap[day]) dailyMap[day].sent++;
        if ((e.open_count || 0) > 0 && dailyMap[day]) dailyMap[day].opened++;
      });

      received.forEach(e => {
        const day = (e.created_at || '').split('T')[0];
        if (dailyMap[day]) dailyMap[day].replied++;
      });

      const dailyStats = Object.entries(dailyMap)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const totalSent = sent.length;
      const totalOpened = opened.length;

      return {
        totalSent,
        totalOpened,
        totalReplied: received.length,
        totalBounced: 0,
        openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
        replyRate: totalSent > 0 ? Math.round((received.length / totalSent) * 100) : 0,
        bounceRate: 0,
        dailyStats,
      };
    },
    enabled: !!user,
  });
}

export function useActivityAnalytics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activity-analytics', user?.id],
    queryFn: async (): Promise<ActivityAnalytics> => {
      if (!user) return { totalContacts: 0, newContactsThisMonth: 0, totalTasks: 0, completedTasks: 0, taskCompletionRate: 0, totalNotes: 0, totalDocuments: 0, recentActivities: [] };

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [contactsRes, tasksRes, notesRes, docsRes, newContactsRes] = await Promise.all([
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('tasks').select('completed').eq('user_id', user.id),
        supabase.from('notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart.toISOString()),
      ]);

      const tasks = tasksRes.data || [];
      const completed = tasks.filter(t => t.completed).length;

      return {
        totalContacts: contactsRes.count || 0,
        newContactsThisMonth: newContactsRes.count || 0,
        totalTasks: tasks.length,
        completedTasks: completed,
        taskCompletionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
        totalNotes: notesRes.count || 0,
        totalDocuments: docsRes.count || 0,
        recentActivities: [],
      };
    },
    enabled: !!user,
  });
}
