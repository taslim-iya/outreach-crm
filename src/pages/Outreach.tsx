import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Send, FileText, BarChart3, Plus, Sparkles, Inbox } from 'lucide-react';
import { useEmails } from '@/hooks/useEmails';

export default function Outreach() {
  const { data: emails = [] } = useEmails(100);
  
  // Calculate real stats from emails
  const totalSent = emails.length;
  const readEmails = emails.filter(e => e.is_read).length;
  const openRate = totalSent > 0 ? Math.round((readEmails / totalSent) * 100) : 0;

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
                <p className="text-2xl font-semibold">0</p>
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
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No templates yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first email template to get started
              </p>
            </div>
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
