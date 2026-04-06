import { MetricCard } from '@/components/dashboard/MetricCard';
import { PipelinePreview } from '@/components/dashboard/PipelinePreview';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { TaskList } from '@/components/dashboard/TaskList';
import { PageHeader } from '@/components/ui/PageHeader';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useAppMode } from '@/hooks/useAppMode';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Percent,
  Loader2,
  TrendingUp,
  Mail,
  Target,
  MessageCircle,
  Send,
  MousePointer,
} from 'lucide-react';

export default function Dashboard() {
  const { data: metrics, isLoading } = useDashboardMetrics();
  const { mode } = useAppMode();

  const campaignStages = metrics ? [
    { name: 'Sent', count: metrics.investorsByStage.outreach_sent, color: 'bg-stage-cold' },
    { name: 'Opened', count: metrics.investorsByStage.follow_up, color: 'bg-info' },
    { name: 'Replied', count: metrics.investorsByStage.meeting_scheduled, color: 'bg-stage-warm' },
    { name: 'Interested', count: metrics.investorsByStage.interested, color: 'bg-primary' },
    { name: 'Booked', count: metrics.investorsByStage.committed + metrics.investorsByStage.closed, color: 'bg-success' },
  ] : [];

  const sequenceStages = metrics ? [
    { name: 'Queued', count: metrics.dealsByStage.identified + metrics.dealsByStage.researching, color: 'bg-stage-cold' },
    { name: 'Step 1 Sent', count: metrics.dealsByStage.outreach_sent + metrics.dealsByStage.follow_up, color: 'bg-info' },
    { name: 'Step 2 Sent', count: metrics.dealsByStage.nda_sent + metrics.dealsByStage.nda_signed, color: 'bg-stage-warm' },
    { name: 'Replied', count: metrics.dealsByStage.in_discussion + metrics.dealsByStage.due_diligence, color: 'bg-primary' },
    { name: 'Converted', count: metrics.dealsByStage.loi + metrics.dealsByStage.closed, color: 'bg-success' },
  ] : [];

  const campaignTotal = campaignStages.reduce((sum, s) => sum + s.count, 0) || 1;
  const sequenceTotal = sequenceStages.reduce((sum, s) => sum + s.count, 0) || 1;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isFundraising = mode === 'campaigns';

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Dashboard"
        description={isFundraising
          ? 'Track email campaigns, deliverability, and reply rates'
          : 'Track sequences, lead engagement, and conversions'}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isFundraising ? (
          <>
            <MetricCard title="Emails Sent" value={metrics?.investorsContacted || 0} icon={<Send className="w-5 h-5" />} />
            <MetricCard title="Open Rate" value={`${metrics?.responseRate || 0}%`} icon={<MousePointer className="w-5 h-5" />} />
            <MetricCard title="Replies" value={metrics?.meetingsBooked || 0} icon={<Mail className="w-5 h-5" />} />
            <MetricCard title="Meetings Booked" value={metrics?.commitments || 0} icon={<Calendar className="w-5 h-5" />} />
          </>
        ) : (
          <>
            <MetricCard title="Active Sequences" value={metrics?.totalDeals || 0} icon={<Target className="w-5 h-5" />} />
            <MetricCard title="Leads Contacted" value={metrics?.ndasSigned || 0} icon={<Users className="w-5 h-5" />} />
            <MetricCard title="Reply Rate" value={`${((metrics?.totalDeals || 0) > 0 ? Math.round(((metrics?.dealsByStage.in_discussion || 0) / (metrics?.totalDeals || 1)) * 100) : 0)}%`} icon={<Percent className="w-5 h-5" />} />
            <MetricCard title="Pending Follow-ups" value={metrics?.pendingTasks || 0} icon={<Calendar className="w-5 h-5" />} />
          </>
        )}
      </div>

      {/* Pipeline & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {isFundraising ? (
          <PipelinePreview title="Campaign Pipeline" stages={campaignStages} href="/outreach" total={campaignTotal} />
        ) : (
          <PipelinePreview title="Sequence Pipeline" stages={sequenceStages} href="/deal-sourcing" total={sequenceTotal} />
        )}
        <ActivityFeed />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TaskList />
      </div>

      <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
        <Link to="/support" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
          <MessageCircle className="w-4 h-4" />
          Need help? Chat with us
        </Link>
      </div>
    </div>
  );
}
