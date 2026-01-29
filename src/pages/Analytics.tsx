import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockKPIs } from '@/data/mockData';

export default function Analytics() {
  const funnelData = [
    { stage: 'Contacted', count: 47, percentage: 100 },
    { stage: 'Responded', count: 16, percentage: 34 },
    { stage: 'Meeting', count: 8, percentage: 17 },
    { stage: 'Interested', count: 5, percentage: 11 },
    { stage: 'Committed', count: 3, percentage: 6 },
  ];

  const weeklyData = [
    { week: 'Week 1', outreach: 12, meetings: 2, deals: 0 },
    { week: 'Week 2', outreach: 15, meetings: 3, deals: 1 },
    { week: 'Week 3', outreach: 10, meetings: 2, deals: 0 },
    { week: 'Week 4', outreach: 10, meetings: 1, deals: 1 },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Analytics"
        description="Track your search fund performance"
      />

      {/* Funnel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Investor Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((stage, index) => (
              <div key={stage.stage} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-24">{stage.stage}</span>
                <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="h-full gradient-gold transition-all duration-500 flex items-center justify-end pr-3"
                    style={{ width: `${stage.percentage}%` }}
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
        </CardContent>
      </Card>

      {/* Weekly Activity */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Weekly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {weeklyData.map((week) => (
              <div key={week.week} className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-2">{week.week}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Outreach</span>
                    <span className="font-medium">{week.outreach}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Meetings</span>
                    <span className="font-medium">{week.meetings}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deals</span>
                    <span className="font-medium">{week.deals}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-semibold text-foreground">{mockKPIs.outreachSent}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Outreach</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-semibold text-foreground">{mockKPIs.responseRate}%</p>
            <p className="text-sm text-muted-foreground mt-1">Response Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-semibold text-foreground">{mockKPIs.conversionRate}%</p>
            <p className="text-sm text-muted-foreground mt-1">Conversion Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-semibold text-foreground">{mockKPIs.meetingsBooked}</p>
            <p className="text-sm text-muted-foreground mt-1">Meetings This Month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
