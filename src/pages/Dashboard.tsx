import { MetricCard } from '@/components/dashboard/MetricCard';
import { PipelinePreview } from '@/components/dashboard/PipelinePreview';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { TaskList } from '@/components/dashboard/TaskList';
import { PageHeader } from '@/components/ui/PageHeader';
import { mockKPIs } from '@/data/mockData';
import {
  Users,
  Mail,
  Calendar,
  FileCheck,
  TrendingUp,
  Building2,
  Percent,
  Target,
} from 'lucide-react';

const investorStages = [
  { name: 'Outreach', count: 15, color: 'bg-stage-cold' },
  { name: 'Follow-up', count: 8, color: 'bg-info' },
  { name: 'Meeting', count: 5, color: 'bg-stage-warm' },
  { name: 'Interested', count: 3, color: 'bg-primary' },
  { name: 'Committed', count: 2, color: 'bg-success' },
];

const dealStages = [
  { name: 'Researching', count: 12, color: 'bg-stage-cold' },
  { name: 'Outreach', count: 6, color: 'bg-info' },
  { name: 'NDA Sent', count: 4, color: 'bg-stage-warm' },
  { name: 'Discussion', count: 2, color: 'bg-primary' },
  { name: 'Due Diligence', count: 1, color: 'bg-success' },
];

export default function Dashboard() {
  return (
    <div className="p-6">
      <PageHeader
        title="Dashboard"
        description="Your search fund command center"
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Investors Contacted"
          value={mockKPIs.outreachSent}
          change={12}
          changeLabel="vs last week"
          icon={<Users className="w-5 h-5" />}
        />
        <MetricCard
          title="Response Rate"
          value={`${mockKPIs.responseRate}%`}
          change={5}
          changeLabel="vs last week"
          icon={<Percent className="w-5 h-5" />}
        />
        <MetricCard
          title="Meetings Booked"
          value={mockKPIs.meetingsBooked}
          change={25}
          changeLabel="vs last week"
          icon={<Calendar className="w-5 h-5" />}
        />
        <MetricCard
          title="NDAs Signed"
          value={mockKPIs.ndasSigned}
          change={-10}
          changeLabel="vs last week"
          icon={<FileCheck className="w-5 h-5" />}
        />
      </div>

      {/* Pipeline Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <PipelinePreview
          title="Investor Pipeline"
          stages={investorStages}
          href="/investors"
          total={33}
        />
        <PipelinePreview
          title="Deal Pipeline"
          stages={dealStages}
          href="/deals"
          total={25}
        />
      </div>

      {/* Activity & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityFeed />
        <TaskList />
      </div>
    </div>
  );
}
