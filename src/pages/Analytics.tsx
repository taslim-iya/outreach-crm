import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useInvestorDeals } from '@/hooks/useInvestorDeals';
import { useCompanies } from '@/hooks/useCompanies';
import { Loader2, TrendingUp, Users, Target, BarChart3 } from 'lucide-react';

export default function Analytics() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: investorDeals, isLoading: investorsLoading } = useInvestorDeals();
  const { data: companies, isLoading: companiesLoading } = useCompanies();

  const isLoading = metricsLoading || investorsLoading || companiesLoading;

  // Calculate funnel data from real investor deals
  const funnelData = investorDeals ? [
    { stage: 'Contacted', count: investorDeals.filter(d => d.stage !== 'not_contacted').length, percentage: 100 },
    { stage: 'Responded', count: investorDeals.filter(d => ['follow_up', 'meeting_scheduled', 'interested', 'committed', 'closed'].includes(d.stage)).length },
    { stage: 'Meeting', count: investorDeals.filter(d => ['meeting_scheduled', 'interested', 'committed', 'closed'].includes(d.stage)).length },
    { stage: 'Interested', count: investorDeals.filter(d => ['interested', 'committed', 'closed'].includes(d.stage)).length },
    { stage: 'Committed', count: investorDeals.filter(d => ['committed', 'closed'].includes(d.stage)).length },
  ].map((item, _, arr) => ({
    ...item,
    percentage: arr[0].count > 0 ? Math.round((item.count / arr[0].count) * 100) : 0
  })) : [];

  // Calculate real metrics
  const totalInvestors = investorDeals?.length || 0;
  const totalCompanies = companies?.length || 0;
  const committedAmount = investorDeals?.reduce((sum, d) => sum + (d.commitment_amount || 0), 0) || 0;
  const activeDeals = companies?.filter(c => !['passed', 'closed'].includes(c.stage)).length || 0;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Analytics"
        description="Track your search fund performance"
      />

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="goldman-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-semibold tracking-tight">{totalInvestors}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Investors</p>
          </CardContent>
        </Card>
        <Card className="goldman-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-semibold tracking-tight">{totalCompanies}</p>
            <p className="text-sm text-muted-foreground mt-1">Target Companies</p>
          </CardContent>
        </Card>
        <Card className="goldman-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-3xl font-semibold tracking-tight">
              ${committedAmount > 0 ? (committedAmount / 1000).toFixed(0) + 'K' : '0'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Committed Capital</p>
          </CardContent>
        </Card>
        <Card className="goldman-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-info" />
              </div>
            </div>
            <p className="text-3xl font-semibold tracking-tight">{activeDeals}</p>
            <p className="text-sm text-muted-foreground mt-1">Active Deals</p>
          </CardContent>
        </Card>
      </div>

      {/* Investor Funnel */}
      <Card className="goldman-card mb-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Investor Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {funnelData.length > 0 && funnelData[0].count > 0 ? (
            <div className="space-y-3">
              {funnelData.map((stage) => (
                <div key={stage.stage} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-24">{stage.stage}</span>
                  <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 flex items-center justify-end pr-3"
                      style={{ width: `${Math.max(stage.percentage, 5)}%` }}
                    >
                      <span className="text-xs font-medium text-primary-foreground">
                        {stage.count}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {stage.percentage}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No investor data yet. Add investors to see your funnel.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="goldman-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Investor Stages</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics && (
              <div className="space-y-3">
                {[
                  { label: 'Not Contacted', count: metrics.investorsByStage.not_contacted, color: 'bg-muted-foreground' },
                  { label: 'Outreach Sent', count: metrics.investorsByStage.outreach_sent, color: 'bg-stage-cold' },
                  { label: 'Follow Up', count: metrics.investorsByStage.follow_up, color: 'bg-info' },
                  { label: 'Meeting Scheduled', count: metrics.investorsByStage.meeting_scheduled, color: 'bg-stage-warm' },
                  { label: 'Interested', count: metrics.investorsByStage.interested, color: 'bg-primary' },
                  { label: 'Committed', count: metrics.investorsByStage.committed, color: 'bg-success' },
                  { label: 'Closed', count: metrics.investorsByStage.closed, color: 'bg-success' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="goldman-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Deal Stages</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics && (
              <div className="space-y-3">
                {[
                  { label: 'Identified', count: metrics.dealsByStage.identified, color: 'bg-muted-foreground' },
                  { label: 'Researching', count: metrics.dealsByStage.researching, color: 'bg-stage-cold' },
                  { label: 'Outreach Sent', count: metrics.dealsByStage.outreach_sent, color: 'bg-info' },
                  { label: 'NDA Sent', count: metrics.dealsByStage.nda_sent, color: 'bg-stage-warm' },
                  { label: 'In Discussion', count: metrics.dealsByStage.in_discussion, color: 'bg-primary' },
                  { label: 'Due Diligence', count: metrics.dealsByStage.due_diligence, color: 'bg-success' },
                  { label: 'LOI', count: metrics.dealsByStage.loi, color: 'bg-success' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
