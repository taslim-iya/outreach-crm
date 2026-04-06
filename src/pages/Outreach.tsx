import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Send, FileText, BarChart3, Plus, Sparkles, Inbox, Pencil, Trash2 } from 'lucide-react';
import { useEmails } from '@/hooks/useEmails';
import { useEmailTemplates, useDeleteEmailTemplate, EmailTemplate } from '@/hooks/useEmailTemplates';
import { TemplateFormModal } from '@/components/outreach/TemplateFormModal';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
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

// Categories that belong to each mode
const FUNDRAISING_CATS = new Set(['investor_outreach', 'follow_up', 'meeting_request', 'thank_you', 'general']);
const DEAL_SOURCING_CATS = new Set(['founder_outreach', 'broker_intro', 'follow_up', 'meeting_request', 'deal_sourcing', 'general']);

export default function Outreach() {
  const navigate = useNavigate();
  const { mode } = useAppMode();
  const { data: emails = [] } = useEmails(100);
  const { data: allTemplates = [] } = useEmailTemplates();
  const deleteTemplate = useDeleteEmailTemplate();

  // Filter templates by current mode
  const allowedCats = mode === 'deal-sourcing' ? DEAL_SOURCING_CATS : FUNDRAISING_CATS;
  const templates = allTemplates.filter(t => allowedCats.has(t.category));
  
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  // Calculate real stats from emails
  const totalSent = emails.length;
  const readEmails = emails.filter(e => e.is_read).length;
  const openRate = totalSent > 0 ? Math.round((readEmails / totalSent) * 100) : 0;

  const handleNewCampaign = () => {
    toast({
      title: 'Coming Soon',
      description: 'Email campaigns feature is coming soon!',
    });
  };

  const handleComposeWithAI = () => {
    const prompt = mode === 'deal-sourcing'
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
            onClick={handleNewCampaign}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{openRate}%</p>
                <p className="text-sm text-muted-foreground">Read Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-semibold">0%</p>
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
                <p className="text-sm text-muted-foreground">Active Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Templates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Email Templates</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleNewTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No templates yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create your first email template to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{template.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{template.subject}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Active Campaigns</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              disabled
              className="opacity-50"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No campaigns yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Launch your first campaign to track performance
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Compose */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Email Composer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground flex-1">
              Let AI help you draft personalized outreach emails based on your contact's profile and your goals.
            </p>
            <Button onClick={handleComposeWithAI}>
              <Sparkles className="w-4 h-4 mr-2" />
              Compose with AI
            </Button>
          </div>
        </CardContent>
      </Card>

      <TemplateFormModal
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        template={editingTemplate}
      />
    </div>
  );
}
