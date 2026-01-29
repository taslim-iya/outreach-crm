import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Send, FileText, BarChart3, Plus, Sparkles } from 'lucide-react';

const templates = [
  { id: '1', name: 'Investor Intro', subject: 'Search Fund Investment Opportunity', opens: 42, replies: 8 },
  { id: '2', name: 'Seller Outreach', subject: 'Interested in acquiring [Company]', opens: 28, replies: 5 },
  { id: '3', name: 'Broker Intro', subject: 'Partnership opportunity - Search Fund', opens: 35, replies: 6 },
];

const campaigns = [
  { id: '1', name: 'Q1 Investor Push', status: 'active', sent: 150, opened: 89, replied: 23 },
  { id: '2', name: 'Manufacturing Targets', status: 'paused', sent: 45, opened: 18, replied: 4 },
];

export default function Outreach() {
  return (
    <div className="p-6">
      <PageHeader
        title="Outreach"
        description="Manage email campaigns and templates"
        actions={
          <Button className="gradient-gold text-primary-foreground hover:opacity-90">
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
                <p className="text-2xl font-semibold">195</p>
                <p className="text-sm text-muted-foreground">Emails Sent</p>
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
                <p className="text-2xl font-semibold">54.9%</p>
                <p className="text-sm text-muted-foreground">Open Rate</p>
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
                <p className="text-2xl font-semibold">13.8%</p>
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
                <p className="text-2xl font-semibold">3</p>
                <p className="text-sm text-muted-foreground">Active Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Email Templates</CardTitle>
            <Button variant="ghost" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.subject}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{template.opens} opens</p>
                  <p className="text-xs text-success">{template.replies} replies</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Active Campaigns</CardTitle>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{campaign.name}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      campaign.status === 'active'
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{campaign.sent} sent</span>
                  <span>{Math.round((campaign.opened / campaign.sent) * 100)}% opened</span>
                  <span>{Math.round((campaign.replied / campaign.sent) * 100)}% replied</span>
                </div>
              </div>
            ))}
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
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Compose with AI
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
