import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
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
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Loader2, Mail, Eye, Send, TrendingUp, Users, BarChart3, Download, Activity } from 'lucide-react';
import { format, subDays } from 'date-fns';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AdminAnalytics({ embedded }: { embedded?: boolean }) {
  const [dateRange, setDateRange] = useState('30');
  const days = parseInt(dateRange);

  const { data: emailAnalytics, isLoading: emailsLoading } = useEmailAnalytics(days);
  const { data: metrics } = useDashboardMetrics();
  const { data: investors } = useInvestorDeals();
  const { data: companies } = useCompanies();
  const { data: emails } = useEmails(200);
  const { data: tasks } = useTasks();
  const { data: activities } = useActivities();

  const isLoading = emailsLoading;

  // Pipeline stage distribution for pie chart
  const stageData = investors ? [
    { name: 'Not Contacted', value: investors.filter(i => i.stage === 'not_contacted').length },
    { name: 'Outreach', value: investors.filter(i => i.stage === 'outreach_sent').length },
    { name: 'Follow Up', value: investors.filter(i => i.stage === 'follow_up').length },
    { name: 'Meeting', value: investors.filter(i => i.stage === 'meeting_scheduled').length },
    { name: 'Interested', value: investors.filter(i => i.stage === 'interested').length },
    { name: 'Committed', value: investors.filter(i => ['committed', 'closed'].includes(i.stage)).length },
  ].filter(s => s.value > 0) : [];

  // Recent opened emails
  const openedEmails = (emails || [])
    .filter((e: any) => e.direction === 'outbound' && (e as any).open_count > 0)
    .sort((a: any, b: any) => new Date((b as any).last_opened_at || 0).getTime() - new Date((a as any).last_opened_at || 0).getTime())
    .slice(0, 15);

  // Task completion rate
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.completed)?.length || 0;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Export CSV
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
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'p-6'}>
      {!embedded && (
        <PageHeader
          title="Admin Analytics"
          description="Email tracking, pipeline metrics, and user activity"
          actions={
            <div className="flex gap-2 items-center">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          }
        />
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="goldman-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Send className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Emails Sent</span>
            </div>
            <p className="text-2xl font-semibold">{emailAnalytics?.totalSent || 0}</p>
          </CardContent>
        </Card>
        <Card className="goldman-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Open Rate</span>
            </div>
            <p className="text-2xl font-semibold">{emailAnalytics?.openRate || 0}%</p>
          </CardContent>
        </Card>
        <Card className="goldman-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-info" />
              <span className="text-xs text-muted-foreground">Total Investors</span>
            </div>
            <p className="text-2xl font-semibold">{investors?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="goldman-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Task Completion</span>
            </div>
            <p className="text-2xl font-semibold">{taskCompletionRate}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="email" className="space-y-4">
        <TabsList>
          <TabsTrigger value="email">Email Tracking</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Email Tracking Tab */}
        <TabsContent value="email" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Email Volume Chart */}
            <Card className="goldman-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Email Volume</CardTitle>
              </CardHeader>
              <CardContent>
                {emailAnalytics && emailAnalytics.emailsByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={emailAnalytics.emailsByDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => format(new Date(v), 'MM/dd')} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip labelFormatter={(v) => format(new Date(v), 'MMM d, yyyy')} />
                      <Bar dataKey="sent" fill="hsl(var(--primary))" name="Sent" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="received" fill="hsl(var(--chart-2))" name="Received" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                    No email data for this period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Open Rate Chart */}
            <Card className="goldman-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Opens Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {emailAnalytics && emailAnalytics.emailsByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={emailAnalytics.emailsByDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => format(new Date(v), 'MM/dd')} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip labelFormatter={(v) => format(new Date(v), 'MMM d, yyyy')} />
                      <Line type="monotone" dataKey="opened" stroke="hsl(var(--success))" name="Opened" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="sent" stroke="hsl(var(--primary))" name="Sent" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                    No data for this period
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recently Opened Emails */}
          <Card className="goldman-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Recently Opened Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              {openedEmails.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Opens</TableHead>
                      <TableHead>First Opened</TableHead>
                      <TableHead>Last Opened</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openedEmails.map((email: any) => (
                      <TableRow key={email.id}>
                        <TableCell className="font-medium text-sm">{email.to_emails?.[0] || 'Unknown'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{email.subject}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{email.open_count}×</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {email.first_opened_at ? format(new Date(email.first_opened_at), 'MMM d, h:mm a') : '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {email.last_opened_at ? format(new Date(email.last_opened_at), 'MMM d, h:mm a') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No opened emails yet. Send emails to start tracking.</p>
              )}
            </CardContent>
          </Card>

          {/* Top Recipients */}
          <Card className="goldman-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Top Recipients</CardTitle>
            </CardHeader>
            <CardContent>
              {emailAnalytics && emailAnalytics.topRecipients.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Emails Sent</TableHead>
                      <TableHead>Opens</TableHead>
                      <TableHead>Open Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailAnalytics.topRecipients.map((r) => (
                      <TableRow key={r.email}>
                        <TableCell className="font-medium text-sm">{r.email}</TableCell>
                        <TableCell>{r.count}</TableCell>
                        <TableCell>{r.opens}</TableCell>
                        <TableCell>
                          <Badge variant={r.count > 0 && r.opens / r.count > 0.5 ? 'default' : 'secondary'}>
                            {r.count > 0 ? Math.round((r.opens / r.count) * 100) : 0}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="goldman-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Investor Stage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {stageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={stageData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {stageData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No investors yet</div>
                )}
              </CardContent>
            </Card>

            <Card className="goldman-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Total Investors', value: investors?.length || 0, icon: Users },
                  { label: 'Total Companies', value: companies?.length || 0, icon: BarChart3 },
                  { label: 'Committed Capital', value: `$${((investors?.reduce((s, i) => s + (i.commitment_amount || 0), 0) || 0) / 1000).toFixed(0)}K`, icon: TrendingUp },
                  { label: 'Active Tasks', value: tasks?.filter(t => !t.completed)?.length || 0, icon: Activity },
                  { label: 'Completed Tasks', value: completedTasks, icon: Activity },
                  { label: 'Recent Activities', value: activities?.length || 0, icon: Activity },
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <m.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{m.label}</span>
                    </div>
                    <span className="font-semibold text-sm">{m.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="goldman-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activities && activities.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {activities.slice(0, 30).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No activity logged yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
