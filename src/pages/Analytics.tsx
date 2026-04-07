import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePipelineAnalytics, useEmailAnalyticsDetailed, useActivityAnalytics } from '@/hooks/useAnalytics';
import { useTopScoredContacts } from '@/hooks/useContactScoring';
import {
  Loader2,
  Users,
  Mail,
  MessageSquare,
  TrendingUp,
  Download,
  FileText,
  FolderOpen,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const STAGE_COLORS = [
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
];

const DEAL_COLORS = [
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
];

const PIE_COLORS = ['#10b981', '#e5e7eb'];

function formatStageName(stage: string): string {
  return stage
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Analytics() {
  const [days, setDays] = useState(30);

  const { data: pipeline, isLoading: pipelineLoading } = usePipelineAnalytics();
  const { data: emailData, isLoading: emailLoading } = useEmailAnalyticsDetailed(days);
  const { data: activity, isLoading: activityLoading } = useActivityAnalytics();
  const { data: topContacts, isLoading: contactsLoading } = useTopScoredContacts(10);

  const isLoading = pipelineLoading || emailLoading || activityLoading || contactsLoading;

  const handleExportCSV = () => {
    if (!emailData) return;
    const headers = ['Date', 'Sent', 'Opened', 'Replied'];
    const rows = emailData.dailyStats.map((d) => [d.date, d.sent, d.opened, d.replied].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const maxContactScore = topContacts && topContacts.length > 0
    ? Math.max(...topContacts.map((c) => c.engagement_score || 0), 1)
    : 1;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Analytics"
        description="Track your outreach performance"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              {[7, 30, 90].map((d) => (
                <Button
                  key={d}
                  variant={days === d ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs px-3 h-7"
                  onClick={() => setDays(d)}
                >
                  {d}d
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-1.5" />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Row 1: KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="goldman-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-semibold tracking-tight">{activity?.totalContacts ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Total Contacts
              {(activity?.newContactsThisMonth ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  +{activity?.newContactsThisMonth} this month
                </Badge>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="goldman-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-semibold tracking-tight">{emailData?.totalSent ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Emails Sent
              {(emailData?.openRate ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {emailData?.openRate}% opened
                </Badge>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="goldman-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <p className="text-3xl font-semibold tracking-tight">{emailData?.replyRate ?? 0}%</p>
            <p className="text-sm text-muted-foreground mt-1">Reply Rate</p>
          </CardContent>
        </Card>

        <Card className="goldman-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-3xl font-semibold tracking-tight">{pipeline?.conversionRate ?? 0}%</p>
            <p className="text-sm text-muted-foreground mt-1">Conversion Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Email Performance Chart */}
      <Card className="goldman-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Email Performance</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#3b82f6]" /> Sent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#10b981]" /> Opened
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#f59e0b]" /> Replied
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {emailData && emailData.dailyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={emailData.dailyStats} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOpened" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradReplied" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                <Tooltip
                  labelFormatter={formatShortDate}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="sent" stroke="#3b82f6" fill="url(#gradSent)" strokeWidth={2} />
                <Area type="monotone" dataKey="opened" stroke="#10b981" fill="url(#gradOpened)" strokeWidth={2} />
                <Area type="monotone" dataKey="replied" stroke="#f59e0b" fill="url(#gradReplied)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No email data for this period.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 3: Pipeline Funnel + Deal Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline Funnel */}
        <Card className="goldman-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Investor Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {pipeline && pipeline.investorsByStage.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={pipeline.investorsByStage}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    tickFormatter={formatStageName}
                    tick={{ fontSize: 11 }}
                    width={110}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, 'Count']}
                    labelFormatter={formatStageName}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {pipeline.investorsByStage.map((_, index) => (
                      <Cell key={index} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No investor data yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deal Pipeline */}
        <Card className="goldman-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Deal Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {pipeline && pipeline.dealsByStage.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={pipeline.dealsByStage}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    tickFormatter={formatStageName}
                    tick={{ fontSize: 11 }}
                    width={110}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, 'Count']}
                    labelFormatter={formatStageName}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {pipeline.dealsByStage.map((_, index) => (
                      <Cell key={index} fill={DEAL_COLORS[index % DEAL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No deal data yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Task Completion + Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Task Completion Donut */}
        <Card className="goldman-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Task Completion</CardTitle>
          </CardHeader>
          <CardContent>
            {activity && activity.totalTasks > 0 ? (
              <div className="flex items-center justify-center">
                <div className="relative">
                  <ResponsiveContainer width={220} height={220}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: activity.completedTasks },
                          { name: 'Pending', value: activity.totalTasks - activity.completedTasks },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {PIE_COLORS.map((color, index) => (
                          <Cell key={index} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-semibold">{activity.taskCompletionRate}%</span>
                    <span className="text-xs text-muted-foreground">completed</span>
                  </div>
                </div>
                <div className="ml-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm">{activity.completedTasks} completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{activity.totalTasks - activity.completedTasks} pending</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tasks yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card className="goldman-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{activity?.totalContacts ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Contacts</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{activity?.totalNotes ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Notes</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{activity?.totalDocuments ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Documents</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{activity?.totalTasks ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Top Scored Contacts */}
      <Card className="goldman-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Top Scored Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          {topContacts && topContacts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground py-2 pr-4">Name</th>
                    <th className="text-left font-medium text-muted-foreground py-2 pr-4">Email</th>
                    <th className="text-left font-medium text-muted-foreground py-2 pr-4 min-w-[180px]">Score</th>
                    <th className="text-left font-medium text-muted-foreground py-2">Last Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {topContacts.map((contact) => (
                    <tr key={contact.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5 pr-4 font-medium">
                        {contact.first_name} {contact.last_name}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{contact.email || '-'}</td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${Math.round(((contact.engagement_score || 0) / maxContactScore) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8 text-right">{contact.engagement_score || 0}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {contact.last_engagement_at
                          ? new Date(contact.last_engagement_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No scored contacts yet. Engage with contacts to build scores.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
