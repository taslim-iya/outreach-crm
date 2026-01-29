import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { User, Mail, Bell, Shield, Link, Database } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input defaultValue="John" className="mt-1.5" />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input defaultValue="Doe" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input defaultValue="john@searchfund.com" className="mt-1.5" />
            </div>
            <div>
              <Label>Organization</Label>
              <Input defaultValue="JD Search Partners" className="mt-1.5" />
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Integration
            </CardTitle>
            <CardDescription>Connect your email accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-info" />
                </div>
                <div>
                  <p className="text-sm font-medium">Google Workspace</p>
                  <p className="text-xs text-muted-foreground">john@searchfund.com</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Connected</Button>
            </div>
            <Button variant="outline" className="w-full">
              <Link className="w-4 h-4 mr-2" />
              Connect Another Account
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email Replies</p>
                <p className="text-xs text-muted-foreground">Get notified when contacts reply</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Meeting Reminders</p>
                <p className="text-xs text-muted-foreground">30 minutes before meetings</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Weekly Summary</p>
                <p className="text-xs text-muted-foreground">Activity digest every Monday</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Follow-up Alerts</p>
                <p className="text-xs text-muted-foreground">Remind when follow-ups are due</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </CardTitle>
            <CardDescription>Protect your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            <div>
              <Button variant="outline">Change Password</Button>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4" />
              Data Management
            </CardTitle>
            <CardDescription>Export or manage your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline">Export All Data</Button>
            <p className="text-xs text-muted-foreground">
              Download all your contacts, deals, and activity history
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
