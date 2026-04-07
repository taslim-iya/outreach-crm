import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Send,
  FileText,
  BarChart3,
  Plus,
  Sparkles,
  Pencil,
  Trash2,
  Search,
  Play,
  Pause,
  Eye,
  MessageSquare,
  Users,
  Calendar,
} from 'lucide-react';
import { useEmails } from '@/hooks/useEmails';
import { useEmailTemplates, useDeleteEmailTemplate, EmailTemplate } from '@/hooks/useEmailTemplates';
import { useCampaigns, useCampaignRecipients, CampaignStatus, Campaign } from '@/hooks/useCampaigns';
import { TemplateFormModal } from '@/components/outreach/TemplateFormModal';
import { CampaignWizardModal } from '@/components/campaigns/CampaignWizardModal';
import { useAppMode } from '@/hooks/useAppMode';

const CATEGORY_LABELS: Record<string, string> = {
  investor_outreach: 'Investor Outreach',
  founder_outreach: 'Founder Outreach',
  broker_intro: 'Broker Intro / Deal Request',
  follow_up: 'Follow-up',
  meeting_request: 'Meeting Request',
  thank_you: 'Thank You',
  deal_sourcing: 'Deal Sourcing',
  general: 'General',
};

const FUNDRAISING_CATS = new Set(['investor_outreach', 'follow_up', 'meeting_request', 'thank_you', 'general']);
const DEAL_SOURCING_CATS = new Set(['founder_outreach', 'broker_intro', 'follow_up', 'meeting_request', 'deal_sourcing', 'general']);

const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_ICONS: Record<string, typeof Play> = {
  draft: FileText,
  active: Play,
  paused: Pause,
  completed: BarChart3,
  archived: FileText,
};

function CampaignCard({ campaign, onClick }: { campaign: Campaign; onClick: () => void }) {
  const { data: recipients = [] } = useCampaignRecipients(campaign.id);

  const sentCount = recipients.filter((r) => r.status !== 'pending').length;
  const openedCount = recipients.filter((r) => r.opened_at).length;
  const repliedCount = recipients.filter((r) => r.replied_at).length;

  const StatusIcon = STATUS_ICONS[campaign.status] || FileText;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{campaign.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(campaign.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <Badge className={`ml-2 flex-shrink-0 ${STATUS_COLORS[campaign.status as CampaignStatus]}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </Badge>
        </div>

        {campaign.subject && (
          <p className="text-sm text-muted-foreground truncate mb-3">
            Subject: {campaign.subject}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Send className="w-3.5 h-3.5" />
            <span>{sentCount} sent</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{openedCount} opened</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{repliedCount} replied</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Users className="w-3.5 h-3.5" />
            <span>{recipients.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Outreach() {
  const navigate = useNavigate();
  const { mode } = useAppMode();

  // Campaign state
  const [campaignSearch, setCampaignSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [wizardOpen, setWizardOpen] = useState(false);

  // Template state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns(
    campaignSearch || undefined,
    statusFilter === 'all' ? undefined : statusFilter
  );
  const { data: allTemplates = [] } = useEmailTemplates();
  const deleteTemplate = useDeleteEmailTemplate();
  const { data: emails = [] } = useEmails(100);

  // Filter templates by current mode
  const allowedCats = mode === 'deal-sourcing' ? DEAL_SOURCING_CATS : FUNDRAISING_CATS;
  const templates = allTemplates.filter((t) => allowedCats.has(t.category));

  // Calculate stats
  const totalSent = emails.length;
  const outboundEmails = emails.filter((e) => e.direction === 'outbound').length;
  const inboundEmails = emails.filter((e) => e.direction === 'inbound').length;
  const replyRate = outboundEmails > 0 ? Math.round((inboundEmails / outboundEmails) * 100) : 0;
  const activeCampaignCount = campaigns.filter((c) => c.status === 'active').length;

  const handleComposeWithAI = () => {
    const prompt =
      mode === 'deal-sourcing'
        ? 'Help me draft an outreach email to a business owner or broker about a potential acquisition'
        : 'Help me draft an outreach email to an investor';
    navigate('/assistant', { state: { initialPrompt: prompt } });
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateModalOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateModalOpen(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplate.mutateAsync(id);
  };

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Campaigns"
        description="Manage email campaigns and templates"
        actions={
          <Button
            className="gradient-gold text-primary-foreground hover:opacity-90"
            onClick={() => setWizardOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalSent}</p>
                <p className="text-sm text-muted-foreground">Emails Synced</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Play className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{activeCampaignCount}</p>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-info" />
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
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{templates.length}</p>
                <p className="text-sm text-muted-foreground">Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Mail className="w-4 h-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                placeholder="Search campaigns..."
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as CampaignStatus | 'all')}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campaign Grid */}
          {campaignsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-5 w-3/4 bg-muted rounded" />
                      <div className="h-4 w-1/2 bg-muted rounded" />
                      <div className="h-4 w-full bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Mail className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-1">No campaigns yet</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                  {campaignSearch || statusFilter !== 'all'
                    ? 'No campaigns match your current filters. Try adjusting your search.'
                    : 'Create your first email campaign to start engaging with your contacts at scale.'}
                </p>
                {!campaignSearch && statusFilter === 'all' && (
                  <Button onClick={() => setWizardOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onClick={() => navigate(`/campaigns/${campaign.id}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {templates.length} template{templates.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleComposeWithAI}>
                <Sparkles className="w-4 h-4 mr-1.5" />
                Compose with AI
              </Button>
              <Button size="sm" onClick={handleNewTemplate}>
                <Plus className="w-4 h-4 mr-1.5" />
                New Template
              </Button>
            </div>
          </div>

          {templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-1">No templates yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first email template to get started
                </p>
                <Button onClick={handleNewTemplate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{template.name}</h3>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {template.subject}
                        </p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {CATEGORY_LABELS[template.category] || template.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CampaignWizardModal open={wizardOpen} onOpenChange={setWizardOpen} />
      <TemplateFormModal
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        template={editingTemplate}
      />
    </div>
  );
}
