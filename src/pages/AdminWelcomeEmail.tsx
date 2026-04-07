import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { useBrandSettings } from '@/hooks/useBrandSettings';

const DEFAULT_WELCOME = {
  subject: 'Welcome to Acquire CRM',
  heading: 'Welcome to Acquire CRM',
  body: "Thanks for signing up. You're one step away from managing your deal pipeline like a pro.\n\nConfirm your email address to get started.",
  buttonText: 'Get Started',
  footer: "If you didn't create an account, you can safely ignore this email.",
};

export default function AdminWelcomeEmail() {
  const { getAsset } = useBrandSettings();

  // TODO: Move welcome email config from localStorage to a database table (e.g. email_templates or app_settings)
  // so it persists across devices and is available server-side for actual email sending.
  const [welcome, setWelcome] = useState(() => {
    const saved = localStorage.getItem('welcome_email_config');
    return saved ? JSON.parse(saved) : DEFAULT_WELCOME;
  });
  const [saving, setSaving] = useState(false);

  // Use brand logo if available, fall back to default
  const logoUrl = getAsset('email_header_logo_url') || getAsset('logo_full_url') || getAsset('logo_mark_url');

  const handleSave = () => {
    setSaving(true);
    // TODO: Persist to database instead of localStorage
    localStorage.setItem('welcome_email_config', JSON.stringify(welcome));
    setTimeout(() => {
      setSaving(false);
      toast({ title: 'Saved', description: 'Welcome email template updated.' });
    }, 400);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        title="Welcome Email Template"
        description="Configure the automated welcome email for new users"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit Welcome Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input value={welcome.subject} onChange={e => setWelcome({ ...welcome, subject: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Heading</Label>
              <Input value={welcome.heading} onChange={e => setWelcome({ ...welcome, heading: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Body Text</Label>
              <Textarea rows={5} value={welcome.body} onChange={e => setWelcome({ ...welcome, body: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input value={welcome.buttonText} onChange={e => setWelcome({ ...welcome, buttonText: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Footer Text</Label>
              <Textarea rows={2} value={welcome.footer} onChange={e => setWelcome({ ...welcome, footer: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setWelcome(DEFAULT_WELCOME)}>
                Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2 text-xs text-muted-foreground border-b border-border">
                Subject: {welcome.subject}
              </div>
              <div className="p-6 bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-12 w-12 rounded-xl mb-6"
                  />
                )}
                <h2 className="text-xl font-semibold mb-3" style={{ color: '#1a2540', letterSpacing: '-0.02em' }}>
                  {welcome.heading}
                </h2>
                {welcome.body.split('\n').map((line: string, i: number) => (
                  <p key={i} className="text-sm mb-3" style={{ color: '#6b7280', lineHeight: '1.6' }}>
                    {line || '\u00A0'}
                  </p>
                ))}
                <div className="my-6">
                  <span className="inline-block px-6 py-3 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#1a2540' }}>
                    {welcome.buttonText}
                  </span>
                </div>
                <p className="text-xs mt-8" style={{ color: '#9ca3af' }}>
                  {welcome.footer}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
