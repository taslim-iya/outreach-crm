import { MetricCard } from '@/components/dashboard/MetricCard';
import { PipelinePreview } from '@/components/dashboard/PipelinePreview';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { TaskList } from '@/components/dashboard/TaskList';
import { PageHeader } from '@/components/ui/PageHeader';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useAppMode } from '@/hooks/useAppMode';
import {
  Users,
  Calendar,
  Percent,
  Loader2,
  TrendingUp,
  Building2,
  FileSignature,
  Target,
} from 'lucide-react';

export default function Dashboard() {
  const { data: metrics, isLoading } = useDashboardMetrics();
  const { mode } = useAppMode();

  const investorStages = metrics ? [
    { name: 'Outreach', count: metrics.investorsByStage.outreach_sent, color: 'bg-stage-cold' },
    { name: 'Follow-up', count: metrics.investorsByStage.follow_up, color: 'bg-info' },
    { name: 'Meeting', count: metrics.investorsByStage.meeting_scheduled, color: 'bg-stage-warm' },
    { name: 'Interested', count: metrics.investorsByStage.interested, color: 'bg-primary' },
    { name: 'Committed', count: metrics.investorsByStage.committed + metrics.investorsByStage.closed, color: 'bg-success' },
  ] : [];

  const dealStages = metrics ? [
    { name: 'Identified', count: metrics.dealsByStage.identified + metrics.dealsByStage.researching, color: 'bg-stage-cold' },
    { name: 'Outreach', count: metrics.dealsByStage.outreach_sent + metrics.dealsByStage.follow_up, color: 'bg-info' },
    { name: 'NDA', count: metrics.dealsByStage.nda_sent + metrics.dealsByStage.nda_signed, color: 'bg-stage-warm' },
    { name: 'Discussion', count: metrics.dealsByStage.in_discussion + metrics.dealsByStage.due_diligence, color: 'bg-primary' },
    { name: 'LOI / Closed', count: metrics.dealsByStage.loi + metrics.dealsByStage.closed, color: 'bg-success' },
  ] : [];

  const investorTotal = investorStages.reduce((sum, s) => sum + s.count, 0) || 1;
  const dealTotal = dealStages.reduce((sum, s) => sum + s.count, 0) || 1;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isFundraising = mode === 'fundraising';

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Dashboard"
        description={isFundraising
          ? 'Track investor outreach, meetings, and commitments'
          : 'Track deal sourcing pipeline, outreach, and closings'}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isFundraising ? (
          <>
            <MetricCard title="Investors Contacted" value={metrics?.investorsContacted || 0} icon={<Users className="w-5 h-5" />} />
            <MetricCard title="Response Rate" value={`${metrics?.responseRate || 0}%`} icon={<Percent className="w-5 h-5" />} />
            <MetricCard title="Meetings Booked" value={metrics?.meetingsBooked || 0} icon={<Calendar className="w-5 h-5" />} />
            <MetricCard title="Commitments" value={metrics?.commitments || 0} icon={<TrendingUp className="w-5 h-5" />} />
          </>
        ) : (
          <>
            <MetricCard title="Total Deals" value={metrics?.totalDeals || 0} icon={<Building2 className="w-5 h-5" />} />
            <MetricCard title="NDAs Signed" value={metrics?.ndasSigned || 0} icon={<FileSignature className="w-5 h-5" />} />
            <MetricCard title="Active Pipeline" value={(metrics?.totalDeals || 0) - (metrics?.dealsByStage.passed || 0) - (metrics?.dealsByStage.closed || 0)} icon={<Target className="w-5 h-5" />} />
            <MetricCard title="Pending Tasks" value={metrics?.pendingTasks || 0} icon={<Calendar className="w-5 h-5" />} />
          </>
        )}
      </div>

      {/* Pipeline & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {isFundraising ? (
          <PipelinePreview title="Investor Pipeline" stages={investorStages} href="/investors" total={investorTotal} />
        ) : (
          <PipelinePreview title="Deal Pipeline" stages={dealStages} href="/contacts" total={dealTotal} />
        )}
        <ActivityFeed />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TaskList />
      </div>
    </div>
  );
}
