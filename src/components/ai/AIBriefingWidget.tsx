import { useState } from 'react';
import { useAIConfigured, useAIBriefing } from '@/hooks/useAI';
import { AIConfigurePrompt } from './AIConfigurePrompt';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useContacts } from '@/hooks/useContacts';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, RefreshCw, Flame, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

interface BriefingData {
  hotLeads: { name: string; reason: string }[];
  campaignInsights: { insight: string }[];
  needsAttention: { name: string; issue: string }[];
  bestSendTime: string;
  summary: string;
}

export function AIBriefingWidget() {
  const { isConfigured } = useAIConfigured();
  const briefing = useAIBriefing();
  const { data: metrics } = useDashboardMetrics();
  const { data: contacts } = useContacts();
  const { data: tasks } = useTasks();
  const [data, setData] = useState<BriefingData | null>(null);

  const handleGenerate = async () => {
    const dashboardData = `
Dashboard Metrics:
- Total investors: ${metrics?.totalInvestors || 0}
- Response rate: ${metrics?.responseRate || 0}%
- Meetings booked: ${metrics?.meetingsBooked || 0}
- Pending tasks: ${metrics?.pendingTasks || 0}
- Total contacts: ${metrics?.totalContacts || 0}

Recent contacts: ${(contacts || []).slice(0, 10).map(c => `${c.name} (${c.contact_type}, warmth: ${c.warmth})`).join(', ')}

Tasks due: ${(tasks || []).filter(t => !t.completed).slice(0, 5).map(t => t.title).join(', ')}
    `.trim();

    try {
      const result = await briefing.mutateAsync(dashboardData);
      setData(result as BriefingData);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Daily Briefing
          </CardTitle>
          {isConfigured && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleGenerate} disabled={briefing.isPending}>
              {briefing.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isConfigured ? (
          <AIConfigurePrompt compact />
        ) : !data ? (
          <div className="text-center py-4">
            <Button size="sm" onClick={handleGenerate} disabled={briefing.isPending}>
              {briefing.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generate Briefing</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{data.summary}</p>

            {data.hotLeads.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  <span className="text-xs font-semibold">Hot Leads</span>
                </div>
                {data.hotLeads.map((lead, i) => (
                  <div key={i} className="text-xs text-muted-foreground ml-4">
                    <span className="font-medium text-foreground">{lead.name}</span>: {lead.reason}
                  </div>
                ))}
              </div>
            )}

            {data.needsAttention.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs font-semibold">Needs Attention</span>
                </div>
                {data.needsAttention.map((item, i) => (
                  <div key={i} className="text-xs text-muted-foreground ml-4">
                    <span className="font-medium text-foreground">{item.name}</span>: {item.issue}
                  </div>
                ))}
              </div>
            )}

            {data.campaignInsights.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs font-semibold">Insights</span>
                </div>
                {data.campaignInsights.map((item, i) => (
                  <div key={i} className="text-xs text-muted-foreground ml-4">{item.insight}</div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t">
              <Clock className="h-3 w-3" /> Best send time today: <span className="font-medium text-foreground">{data.bestSendTime}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
