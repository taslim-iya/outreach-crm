import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';

type InvestorStage = Database['public']['Enums']['investor_stage'];
type DealStage = Database['public']['Enums']['deal_stage'];

interface DashboardMetrics {
  // Investor pipeline metrics
  investorsContacted: number;
  responseRate: number;
  meetingsBooked: number;
  commitments: number;
  totalInvestors: number;
  investorsByStage: Record<InvestorStage, number>;
  
  // Deal pipeline metrics
  totalDeals: number;
  ndasSigned: number;
  dealsByStage: Record<DealStage, number>;
  
  // Contact metrics
  totalContacts: number;
  
  // Task metrics
  pendingTasks: number;
  completedTasks: number;
}

export function useDashboardMetrics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-metrics', user?.id],
    queryFn: async (): Promise<DashboardMetrics> => {
      if (!user) {
        return getEmptyMetrics();
      }

      // Fetch all data in parallel
      const [investorDealsResult, companiesResult, contactsResult, tasksResult] = await Promise.all([
        supabase.from('investor_deals').select('stage').eq('user_id', user.id),
        supabase.from('companies').select('stage').eq('user_id', user.id),
        supabase.from('contacts').select('contact_type').eq('user_id', user.id),
        supabase.from('tasks').select('completed').eq('user_id', user.id),
      ]);

      // Process investor deals
      const investorDeals = investorDealsResult.data || [];
      const investorsByStage = getInvestorStageCount(investorDeals);
      
      const investorsContacted = investorDeals.filter(
        (d) => d.stage !== 'not_contacted'
      ).length;
      
      const meetingsBooked = investorsByStage.meeting_scheduled || 0;
      const commitments = (investorsByStage.committed || 0) + (investorsByStage.closed || 0);
      
      // Calculate response rate (investors who moved past outreach / total contacted)
      const respondedStages: InvestorStage[] = ['follow_up', 'meeting_scheduled', 'interested', 'committed', 'closed', 'passed'];
      const responded = investorDeals.filter((d) => respondedStages.includes(d.stage)).length;
      const responseRate = investorsContacted > 0 ? Math.round((responded / investorsContacted) * 100) : 0;

      // Process deals
      const companies = companiesResult.data || [];
      const dealsByStage = getDealStageCount(companies);
      const ndasSigned = dealsByStage.nda_signed || 0;

      // Process contacts
      const contacts = contactsResult.data || [];

      // Process tasks
      const tasks = tasksResult.data || [];
      const pendingTasks = tasks.filter((t) => !t.completed).length;
      const completedTasks = tasks.filter((t) => t.completed).length;

      return {
        investorsContacted,
        responseRate,
        meetingsBooked,
        commitments,
        totalInvestors: investorDeals.length,
        investorsByStage,
        totalDeals: companies.length,
        ndasSigned,
        dealsByStage,
        totalContacts: contacts.length,
        pendingTasks,
        completedTasks,
      };
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time feel
  });
}

function getInvestorStageCount(deals: { stage: InvestorStage }[]): Record<InvestorStage, number> {
  const stages: InvestorStage[] = [
    'not_contacted', 'outreach_sent', 'follow_up', 'meeting_scheduled',
    'interested', 'passed', 'committed', 'closed'
  ];
  
  const counts = stages.reduce((acc, stage) => {
    acc[stage] = 0;
    return acc;
  }, {} as Record<InvestorStage, number>);

  deals.forEach((deal) => {
    counts[deal.stage] = (counts[deal.stage] || 0) + 1;
  });

  return counts;
}

function getDealStageCount(deals: { stage: DealStage }[]): Record<DealStage, number> {
  const stages: DealStage[] = [
    'identified', 'researching', 'outreach_sent', 'follow_up', 'nda_sent',
    'nda_signed', 'in_discussion', 'passed', 'due_diligence', 'loi', 'closed'
  ];
  
  const counts = stages.reduce((acc, stage) => {
    acc[stage] = 0;
    return acc;
  }, {} as Record<DealStage, number>);

  deals.forEach((deal) => {
    counts[deal.stage] = (counts[deal.stage] || 0) + 1;
  });

  return counts;
}

function getEmptyMetrics(): DashboardMetrics {
  return {
    investorsContacted: 0,
    responseRate: 0,
    meetingsBooked: 0,
    commitments: 0,
    totalInvestors: 0,
    investorsByStage: {
      not_contacted: 0,
      outreach_sent: 0,
      follow_up: 0,
      meeting_scheduled: 0,
      interested: 0,
      passed: 0,
      committed: 0,
      closed: 0,
    },
    totalDeals: 0,
    ndasSigned: 0,
    dealsByStage: {
      identified: 0,
      researching: 0,
      outreach_sent: 0,
      follow_up: 0,
      nda_sent: 0,
      nda_signed: 0,
      in_discussion: 0,
      passed: 0,
      due_diligence: 0,
      loi: 0,
      closed: 0,
    },
    totalContacts: 0,
    pendingTasks: 0,
    completedTasks: 0,
  };
}
