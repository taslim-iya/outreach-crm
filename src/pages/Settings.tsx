import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Bell, Shield, Calendar, Database, Loader2, Link2, Check } from 'lucide-react';
import { useUserIntegrations, useDisconnectIntegration } from '@/hooks/useUserIntegrations';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuth();
  const { data: integrations = [], isLoading } = useUserIntegrations();
  const disconnectIntegration = useDisconnectIntegration();

  const googleIntegration = integrations.find(i => i.provider === 'google');
  const microsoftIntegration = integrations.find(i => i.provider === 'microsoft');

  const handleConnectGoogle = () => {
    // TODO: Implement Google OAuth flow
    toast.info('Google integration coming soon');
  };

  const handleConnectMicrosoft = () => {
    // TODO: Implement Microsoft OAuth flow
    toast.info('Microsoft integration coming soon');
  };

  const handleDisconnect = async (provider: string) => {
    try {
      await disconnectIntegration.mutateAsync(provider);
      toast.success(`${provider === 'google' ? 'Google' : 'Microsoft'} disconnected`);
    } catch {
      toast.error('Failed to disconnect integration');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your account and integrations"
      />

      <div className="space-y-6">
        {/* Profile */}
        <Card className="goldman-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 font-semibold">
              <User className="w-4 h-4 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Display Name</Label>
                <Input 
                  defaultValue={user?.user_metadata?.full_name || ''} 
                  className="mt-1.5" 
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  value={user?.email || ''} 
                  className="mt-1.5" 
                  disabled 
                />
              </div>
            </div>
            <div>
              <Label>Organization</Label>
              <Input defaultValue="" placeholder="Your company or fund name" className="mt-1.5" />
            </div>
            <Button className="gradient-primary text-primary-foreground">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Email & Calendar Integration */}
        <Card className="goldman-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 font-semibold">
              <Mail className="w-4 h-4 text-primary" />
              Email & Calendar Integration
            </CardTitle>
            <CardDescription>Connect your email and calendar to sync meetings and communications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Google Integration */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                        <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                        <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5818182 23.1818182,9.90909091 L12,9.90909091 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                        <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7## L1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Google Workspace</p>
                      {googleIntegration ? (
                        <p className="text-xs text-muted-foreground">{googleIntegration.email}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Gmail & Google Calendar</p>
                      )}
                    </div>
                  </div>
                  {googleIntegration ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-success/10 text-success border-0">
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDisconnect('google')}
                        disabled={disconnectIntegration.isPending}
                      >
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleConnectGoogle}>
                      <Link2 className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>

                {/* Microsoft Integration */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#F25022" d="M1 1h10v10H1z"/>
                        <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                        <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                        <path fill="#FFB900" d="M13 13h10v10H13z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Microsoft 365</p>
                      {microsoftIntegration ? (
                        <p className="text-xs text-muted-foreground">{microsoftIntegration.email}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Outlook & Microsoft Calendar</p>
                      )}
                    </div>
                  </div>
                  {microsoftIntegration ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-success/10 text-success border-0">
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDisconnect('microsoft')}
                        disabled={disconnectIntegration.isPending}
                      >
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleConnectMicrosoft}>
                      <Link2 className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  Connecting your email and calendar allows SearchCRM to track communications and sync meetings automatically.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="goldman-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 font-semibold">
              <Bell className="w-4 h-4 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Email Replies</p>
                <p className="text-xs text-muted-foreground">Get notified when contacts reply</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Meeting Reminders</p>
                <p className="text-xs text-muted-foreground">30 minutes before meetings</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Weekly Summary</p>
                <p className="text-xs text-muted-foreground">Activity digest every Monday</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Follow-up Alerts</p>
                <p className="text-xs text-muted-foreground">Remind when follow-ups are due</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="goldman-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 font-semibold">
              <Shield className="w-4 h-4 text-primary" />
              Security
            </CardTitle>
            <CardDescription>Protect your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            <div className="pt-2">
              <Button variant="outline">Change Password</Button>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card className="goldman-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 font-semibold">
              <Database className="w-4 h-4 text-primary" />
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
