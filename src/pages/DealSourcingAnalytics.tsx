import { useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDeals, DEAL_STAGE_LABELS, DEAL_STAGES } from '@/hooks/useDeals';
import { useBrokers } from '@/hooks/useBrokers';
import { Loader2, TrendingUp, Mail, Star, ArrowRight, BarChart3 } from 'lucide-react';

export default function DealSourcingAnalytics() {
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: brokers = [], isLoading: brokersLoading } = useBrokers();

  const isLoading = dealsLoading || brokersLoading;

  // Funnel: counts by stage
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DEAL_STAGES.forEach(s => { counts[s] = 0; });
    deals.forEach(d => { counts[d.stage] = (counts[d.stage] || 0) + 1; });
    return counts;
  }, [deals]);

  // Conversion rates between adjacent stages
  const funnelData = useMemo(() => {
    const activeStages = DEAL_STAGES.filter(s => s !== 'lost');
    let cumulativeAbove = deals.length;
    return activeStages.map((stage, i) => {
      const count = stageCounts[stage];
      const prevCount = i === 0 ? deals.length : activeStages.slice(0, i).reduce((s, st) => s + stageCounts[st], 0);
      const rate = prevCount > 0 ? Math.round((count / Math.max(prevCount, 1)) * 100) : 0;
      return { stage, label: DEAL_STAGE_LABELS[stage], count, rate };
    });
  }, [deals, stageCounts]);

  // Source breakdown
  const sourceBreakdown = useMemo(() => {
    const sources: Record<string, number> = { proprietary: 0, brokered: 0, inbound: 0 };
    deals.forEach(d => {
      const src = d.source || 'proprietary';
      sources[src] = (sources[src] || 0) + 1;
    });
    return Object.entries(sources).map(([source, count]) => ({ source, count, pct: deals.length > 0 ? Math.round((count / deals.length) * 100) : 0 }));
  }, [deals]);

  // Broker leaderboard
  const brokerLeaderboard = useMemo(() => {
    const dealsByBroker: Record<string, number> = {};
    deals.forEach(d => {
      if (d.broker_id) {
        dealsByBroker[d.broker_id] = (dealsByBroker[d.broker_id] || 0) + 1;
      }
    });
    return brokers
      .map(b => ({ ...b, dealCount: dealsByBroker[b.id] || 0 }))
      .sort((a, b) => b.dealCount - a.dealCount || (b.responsiveness_score || 0) - (a.responsiveness_score || 0))
      .slice(0, 10);
  }, [deals, brokers]);

  // Lost reason codes
  const lostDeals = deals.filter(d => d.stage === 'lost');

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Sequence Analytics" description="Sequence performance, engagement metrics, and conversion rates" />

      {/* Top-line KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Deals</p>
            <p className="text-2xl font-semibold mt-1">{deals.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Pipeline</p>
            <p className="text-2xl font-semibold mt-1">{deals.filter(d => d.stage !== 'lost' && d.stage !== 'closed_won').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Won</p>
            <p className="text-2xl font-semibold mt-1 text-success">{stageCounts.closed_won}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Lost</p>
            <p className="text-2xl font-semibold mt-1 text-destructive">{stageCounts.lost}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Pipeline Funnel */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Pipeline Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {funnelData.map((item, i) => (
                <div key={item.stage} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 text-right">{item.label}</span>
                  <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${Math.max((item.count / Math.max(deals.length, 1)) * 100, 5)}%` }}
                    >
                      <span className="text-[10px] font-medium text-primary-foreground">{item.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Source Breakdown</CardTitle></CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No deals to analyze yet</p>
            ) : (
              <div className="space-y-4">
                {sourceBreakdown.map(item => (
                  <div key={item.source}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium">{item.source}</span>
                      <span className="text-muted-foreground">{item.count} ({item.pct}%)</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Broker Leaderboard */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Star className="w-4 h-4" /> Broker Responsiveness Leaderboard</CardTitle></CardHeader>
        <CardContent>
          {brokerLeaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No brokers added yet</p>
          ) : (
            <div className="space-y-2">
              {brokerLeaderboard.map((broker, i) => (
                <div key={broker.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <span className="text-sm font-semibold text-muted-foreground w-6">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{broker.firm}</p>
                    <p className="text-xs text-muted-foreground">{broker.contact_name}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= (broker.responsiveness_score || 0) ? 'text-stage-warm fill-stage-warm' : 'text-muted-foreground/20'}`} />
                    ))}
                  </div>
                  <Badge variant="secondary" className="text-xs">{broker.dealCount} deals</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
