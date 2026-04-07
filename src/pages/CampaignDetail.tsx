import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Play,
  Pause,
  Archive,
  Send,
  Eye,
  MessageSquare,
  AlertTriangle,
  Plus,
  Trash2,
  Mail,
  Clock,
} from 'lucide-react';
import {
  useCampaign,
  useCampaignRecipients,
  useCampaignSteps,
  useCampaignAnalytics,
  useActivateCampaign,
  usePauseCampaign,
  useUpdateCampaign,
  useCreateCampaignStep,
  useDeleteCampaignStep,
  CampaignStatus,
  RecipientStatus,
} from '@/hooks/useCampaigns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { toast } from 'sonner';

const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const RECIPIENT_STATUS_COLORS: Record<RecipientStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  opened: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  replied: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  bounced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  unsubscribed: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: campaign, isLoading } = useCampaign(id);
  const { data: recipients = [] } = useCampaignRecipients(id);
  const { data: steps = [] } = useCampaignSteps(id);
  const { data: analytics = [] } = useCampaignAnalytics(id);

  const activateCampaign = useActivateCampaign();
  const pauseCampaign = usePauseCampaign();
  const updateCampaign = useUpdateCampaign();
  const createStep = useCreateCampaignStep();
  const deleteStep = useDeleteCampaignStep();

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Campaign not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/outreach')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  // Compute stats from recipients
  const totalRecipients = recipients.length;
  const sentCount = recipients.filter((r) => r.status !== 'pending').length;
  const openedCount = recipients.filter((r) => r.opened_at).length;
  const repliedCount = recipients.filter((r) => r.replied_at).length;
  const bouncedCount = recipients.filter((r) => r.status === 'bounced').length;

  const openRate = sentCount > 0 ? ((openedCount / sentCount) * 100).toFixed(1) : '0';
  const replyRate = sentCount > 0 ? ((repliedCount / sentCount) * 100).toFixed(1) : '0';
  const bounceRate = sentCount > 0 ? ((bouncedCount / sentCount) * 100).toFixed(1) : '0';

  const handleActivate = () => activateCampaign.mutate(campaign.id);
  const handlePause = () => pauseCampaign.mutate(campaign.id);
  const handleArchive = () =>
    updateCampaign.mutate({ id: campaign.id, status: 'archived' });

  const handleAddStep = () => {
    const nextStep = steps.length + 1;
    createStep.mutate({
      campaign_id: campaign.id,
      step_number: nextStep,
      step_type: 'email',
      subject: '',
      body_html: '',
      delay_days: 3,
    });
  };

  const handleDeleteStep = (stepId: string) => {
    deleteStep.mutate({ id: stepId, campaignId: campaign.id });
  };

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title={campaign.name}
        description={`Created ${formatDate(campaign.created_at)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/outreach')}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>
            {campaign.status === 'draft' || campaign.status === 'paused' ? (
              <Button
                size="sm"
                onClick={handleActivate}
                disabled={activateCampaign.isPending}
                className="gradient-gold text-primary-foreground hover:opacity-90"
              >
                <Play className="w-4 h-4 mr-1.5" />
                {campaign.status === 'draft' ? 'Launch' : 'Resume'}
              </Button>
            ) : campaign.status === 'active' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                disabled={pauseCampaign.isPending}
              >
                <Pause className="w-4 h-4 mr-1.5" />
                Pause
              </Button>
            ) : null}
            {campaign.status !== 'archived' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleArchive}
                disabled={updateCampaign.isPending}
              >
                <Archive className="w-4 h-4 mr-1.5" />
                Archive
              </Button>
            )}
          </div>
        }
      />

      {/* Status Badge */}
      <div className="mb-6">
        <Badge className={STATUS_COLORS[campaign.status as CampaignStatus]}>
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{sentCount}</p>
                <p className="text-sm text-muted-foreground">Total Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{openRate}%</p>
                <p className="text-sm text-muted-foreground">Open Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{replyRate}%</p>
                <p className="text-sm text-muted-foreground">Reply Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{bounceRate}%</p>
                <p className="text-sm text-muted-foreground">Bounce Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recipients">Recipients ({totalRecipients})</TabsTrigger>
          <TabsTrigger value="steps">Steps ({steps.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Analytics Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                  No analytics data yet. Data will appear once the campaign starts sending.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sent"
                      stroke="hsl(217, 91%, 60%)"
                      strokeWidth={2}
                      dot={false}
                      name="Sent"
                    />
                    <Line
                      type="monotone"
                      dataKey="opened"
                      stroke="hsl(142, 71%, 45%)"
                      strokeWidth={2}
                      dot={false}
                      name="Opened"
                    />
                    <Line
                      type="monotone"
                      dataKey="replied"
                      stroke="hsl(262, 83%, 58%)"
                      strokeWidth={2}
                      dot={false}
                      name="Replied"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaign Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">From</p>
                  <p className="font-medium">
                    {campaign.from_name
                      ? `${campaign.from_name} <${campaign.from_email}>`
                      : campaign.from_email || 'Not configured'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Subject</p>
                  <p className="font-medium">{campaign.subject || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Send Days</p>
                  <p className="font-medium">
                    {(campaign.send_days || [])
                      .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
                      .join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Send Window</p>
                  <p className="font-medium">
                    {campaign.send_start_hour}:00 - {campaign.send_end_hour}:00 ({campaign.timezone?.replace(/_/g, ' ')})
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Daily Limit</p>
                  <p className="font-medium">{campaign.daily_limit} emails/day</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(campaign.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recipients Tab */}
        <TabsContent value="recipients" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {recipients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recipients added yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Variant</TableHead>
                        <TableHead>Last Sent</TableHead>
                        <TableHead>Opened</TableHead>
                        <TableHead>Replied</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipients.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{r.name || '-'}</p>
                              <p className="text-xs text-muted-foreground">{r.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={RECIPIENT_STATUS_COLORS[r.status as RecipientStatus]}
                            >
                              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{r.variant_key}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(r.last_sent_at)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(r.opened_at)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(r.replied_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Steps Tab */}
        <TabsContent value="steps" className="mt-4 space-y-4">
          {steps.map((s, idx) => (
            <Card key={s.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {s.step_type === 'email' ? (
                        <Mail className="w-4 h-4 text-primary" />
                      ) : (
                        <Clock className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Step {s.step_number}</p>
                        <Badge variant="outline">{s.step_type}</Badge>
                        <Badge variant="secondary">Variant {s.variant_key}</Badge>
                      </div>
                      {s.step_type === 'email' ? (
                        <div className="mt-2 text-sm">
                          <p className="text-muted-foreground">
                            Subject: <span className="text-foreground">{s.subject || 'Not set'}</span>
                          </p>
                          <p className="text-muted-foreground mt-1 line-clamp-2">
                            {s.body_text || s.body_html || 'No body content'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          Wait {s.delay_days} day{s.delay_days !== 1 ? 's' : ''} before next step
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteStep(s.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={handleAddStep} disabled={createStep.isPending}>
            <Plus className="w-4 h-4 mr-2" />
            Add Step
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
