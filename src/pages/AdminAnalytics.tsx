import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEmailAnalytics } from '@/hooks/useEmailAnalytics';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useInvestorDeals } from '@/hooks/useInvestorDeals';
import { useCompanies } from '@/hooks/useCompanies';
import { useEmails } from '@/hooks/useEmails';
import { useTasks } from '@/hooks/useTasks';
import { useActivities } from '@/hooks/useActivities';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { Loader2, Mail, Eye, Send, TrendingUp, Users, BarChart3, Download, Activity, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import { format, subDays } from 'date-fns';

const CHART_COLORS = [
  'hsl(220, 13%, 18%)',
  'hsl(220, 10%, 40%)',
  'hsl(220, 10%, 60%)',
  'hsl(220, 10%, 75%)',
  'hsl(220, 10%, 88%)',
];

export default function AdminAnalytics({ embedded }: { embedded?: boolean }) {
  const [dateRange, setDateRange] = useState('30');
  const [activeTab, setActiveTab] = useState('email');
  const days = parseInt(dateRange);

  const { data: emailAnalytics, isLoading: emailsLoading } = useEmailAnalytics(days);
  const { data: metrics } = useDashboardMetrics();
  const { data: investors } = useInvestorDeals();
  const { data: companies } = useCompanies();
  const { data: emails } = useEmails(200);
  const { data: tasks } = useTasks();
  const { data: activities } = useActivities();

  const isLoading = emailsLoading;

  const stageData = investors ? [
    { name: 'Not Contacted', value: investors.filter(i => i.stage === 'not_contacted').length },
    { name: 'Outreach', value: investors.filter(i => i.stage === 'outreach_sent').length },
    { name: 'Follow Up', value: investors.filter(i => i.stage === 'follow_up').length },
    { name: 'Meeting', value: investors.filter(i => i.stage === 'meeting_scheduled').length },
    { name: 'Interested', value: investors.filter(i => i.stage === 'interested').length },
    { name: 'Committed', value: investors.filter(i => ['committed', 'closed'].includes(i.stage)).length },
  ].filter(s => s.value > 0) : [];

  const openedEmails = (emails || [])
    .filter((e: any) => e.direction === 'outbound' && (e as any).open_count > 0)
    .sort((a: any, b: any) => new Date((b as any).last_opened_at || 0).getTime() - new Date((a as any).last_opened_at || 0).getTime())
    .slice(0, 15);

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.completed)?.length || 0;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleExport = () => {
    if (!emailAnalytics) return;
    const csvRows = [
      ['Date', 'Emails Sent', 'Emails Received', 'Emails Opened'],
      ...emailAnalytics.emailsByDay.map(d => [d.date, d.sent, d.received, d.opened]),
    ];
    const csvContent = csvRows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-foreground/40" />
          <span className="text-sm text-muted-foreground">Loading analytics...</span>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      label: 'Emails Sent',
      value: emailAnalytics?.totalSent || 0,
      icon: Send,
      change: '+12%',
      positive: true,
    },
    {
      label: 'Open Rate',
      value: `${emailAnalytics?.openRate || 0}%`,
      icon: Eye,
      change: '+3.2%',
      positive: true,
    },
    {
      label: 'Total Investors',
      value: investors?.length || 0,
      icon: Users,
      change: '+5',
      positive: true,
    },
    {
      label: 'Task Completion',
      value: `${taskCompletionRate}%`,
      icon: Activity,
      change: taskCompletionRate > 50 ? 'On track' : 'Needs attention',
      positive: taskCompletionRate > 50,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Hero Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">Track performance across email, pipeline, and activity.</p>
          </div>
          <div className="flex gap-3 items-center">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px] bg-background border-border rounded-full h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="rounded-full h-9 px-4 text-sm border-border"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <div
            key={m.label}
            className="group relative bg-card border border-border rounded-2xl p-5 hover:border-foreground/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                <m.icon className="w-4 h-4 text-foreground/70" />
              </div>
              <span className={`text-xs font-medium flex items-center gap-0.5 ${m.positive ? 'text-success' : 'text-warning'}`}>
                {m.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {m.change}
              </span>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{m.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/50 p-1 rounded-full w-fit">
          <TabsTrigger value="email" className="rounded-full text-sm px-5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Email Tracking
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="rounded-full text-sm px-5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-full text-sm px-5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Email Volume</h3>
              {emailAnalytics && emailAnalytics.emailsByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={emailAnalytics.emailsByDay}>
                    <defs>
                      <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => format(new Date(v), 'MM/dd')} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      labelFormatter={(v) => format(new Date(v), 'MMM d, yyyy')}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Area type="monotone" dataKey="sent" fill="url(#sentGrad)" stroke="hsl(var(--foreground))" strokeWidth={2} name="Sent" />
                    <Area type="monotone" dataKey="received" fill="transparent" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" name="Received" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                  No email data for this period
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Opens Over Time</h3>
              {emailAnalytics && emailAnalytics.emailsByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={emailAnalytics.emailsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => format(new Date(v), 'MM/dd')} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      labelFormatter={(v) => format(new Date(v), 'MMM d, yyyy')}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Line type="monotone" dataKey="opened" stroke="hsl(var(--foreground))" name="Opened" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="sent" stroke="hsl(var(--muted-foreground))" name="Sent" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                  No data for this period
                </div>
              )}
            </div>
          </div>

          {/* Recently Opened Emails */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
              <Eye className="w-4 h-4 text-foreground/60" />
              <h3 className="text-sm font-semibold text-foreground">Recently Opened Emails</h3>
            </div>
            {openedEmails.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recipient</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Opens</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">First Opened</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Opened</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openedEmails.map((email: any) => (
                    <TableRow key={email.id} className="border-border hover:bg-secondary/30">
                      <TableCell className="font-medium text-sm text-foreground">{email.to_emails?.[0] || 'Unknown'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{email.subject}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-xs font-semibold text-foreground">
                          {email.open_count}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {email.first_opened_at ? format(new Date(email.first_opened_at), 'MMM d, h:mm a') : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {email.last_opened_at ? format(new Date(email.last_opened_at), 'MMM d, h:mm a') : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No opened emails yet. Send emails to start tracking.</p>
            )}
          </div>

          {/* Top Recipients */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Top Recipients</h3>
            </div>
            {emailAnalytics && emailAnalytics.topRecipients.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sent</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Opens</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Open Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailAnalytics.topRecipients.map((r) => (
                    <TableRow key={r.email} className="border-border hover:bg-secondary/30">
                      <TableCell className="font-medium text-sm text-foreground">{r.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.opens}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-foreground"
                              style={{ width: `${r.count > 0 ? Math.round((r.opens / r.count) * 100) : 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-foreground">
                            {r.count > 0 ? Math.round((r.opens / r.count) * 100) : 0}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>
            )}
          </div>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Investor Stage Distribution</h3>
              {stageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={stageData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))" label={({ name, value }) => `${name}: ${value}`}>
                      {stageData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No investors yet</div>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-6">Key Metrics</h3>
              <div className="space-y-5">
                {[
                  { label: 'Total Investors', value: investors?.length || 0, icon: Users },
                  { label: 'Total Companies', value: companies?.length || 0, icon: BarChart3 },
                  { label: 'Committed Capital', value: `$${((investors?.reduce((s, i) => s + (i.commitment_amount || 0), 0) || 0) / 1000).toFixed(0)}K`, icon: TrendingUp },
                  { label: 'Active Tasks', value: tasks?.filter(t => !t.completed)?.length || 0, icon: Activity },
                  { label: 'Completed Tasks', value: completedTasks, icon: Activity },
                  { label: 'Recent Activities', value: activities?.length || 0, icon: Activity },
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <m.icon className="w-4 h-4 text-foreground/60" />
                      </div>
                      <span className="text-sm text-foreground">{m.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{m.value}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            </div>
            <div className="divide-y divide-border">
              {activities && activities.length > 0 ? (
                activities.slice(0, 30).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 px-6 py-4 hover:bg-secondary/30 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-foreground mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{activity.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">No activity logged yet</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
