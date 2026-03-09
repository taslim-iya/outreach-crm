import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Mail, Bell, Shield, Database, Loader2, Link2, Check, RefreshCw, DollarSign, Upload, X, ImageIcon } from 'lucide-react';
import { useUserIntegrations, useDisconnectIntegration } from '@/hooks/useUserIntegrations';
import { useSyncIntegration } from '@/hooks/useSyncIntegration';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { useUploadBrandAsset, useRemoveBrandAsset, useBrandSettings } from '@/hooks/useBrandSettings';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

export default function Settings() {
  const { user } = useAuth();
  const { data: integrations = [], isLoading } = useUserIntegrations();
  const disconnectIntegration = useDisconnectIntegration();
  const { isSyncing, syncAll } = useSyncIntegration();
  const [searchParams, setSearchParams] = useSearchParams();
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const uploadAsset = useUploadBrandAsset();
  const removeAsset = useRemoveBrandAsset();
  const { getAsset } = useBrandSettings();

  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Fetch profile settings
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('currency, company_name, display_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Sync form state when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || user?.user_metadata?.full_name || '');
      setCompanyName(profile.company_name || '');
    } else if (user) {
      setDisplayName(user.user_metadata?.full_name || '');
    }
  }, [profile, user]);

  // Update profile mutation (display name + company name)
  const updateProfile = useMutation({
    mutationFn: async ({ displayName, companyName }: { displayName: string; companyName: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('profiles')
          .update({ display_name: displayName, company_name: companyName })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert({ user_id: user.id, display_name: displayName, company_name: companyName });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  // Update currency mutation
  const updateCurrency = useMutation({
    mutationFn: async (currency: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('profiles')
          .update({ currency })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert({ user_id: user.id, currency });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Currency updated');
    },
    onError: () => {
      toast.error('Failed to update currency');
    },
  });

  const handleSaveProfile = () => {
    updateProfile.mutate({ displayName, companyName });
  };

  const googleIntegration = integrations.find(i => i.provider === 'google');
  const microsoftIntegration = integrations.find(i => i.provider === 'microsoft');

  // Handle OAuth callback query params
  useEffect(() => {
    const googleAuth = searchParams.get('google_auth');
    const microsoftAuth = searchParams.get('microsoft_auth');
    const email = searchParams.get('email');
    const message = searchParams.get('message');

    if (googleAuth === 'success') {
      toast.success('Google connected successfully', {
        description: email ? `Connected as ${email}` : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['user_integrations'] });
      setSearchParams({});
    } else if (googleAuth === 'error') {
      toast.error('Failed to connect Google', {
        description: message || 'Please try again',
      });
      setSearchParams({});
    } else if (microsoftAuth === 'success') {
      toast.success('Microsoft connected successfully', {
        description: email ? `Connected as ${email}` : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['user_integrations'] });
      setSearchParams({});
    } else if (microsoftAuth === 'error') {
      toast.error('Failed to connect Microsoft', {
        description: message || 'Please try again',
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, queryClient]);


  const handleConnectGoogle = async () => {
    setConnectingProvider('google');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in first');
        setConnectingProvider(null);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-oauth-init`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start OAuth');
      }

      window.location.assign(data.url);
    } catch (error) {
      console.error('OAuth init error:', error);
      toast.error('Failed to connect Google', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
      setConnectingProvider(null);
    }
  };

  const handleConnectMicrosoft = async () => {
    setConnectingProvider('microsoft');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in first');
        setConnectingProvider(null);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/microsoft-oauth-init`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start Microsoft OAuth');
      }

      console.log('Microsoft OAuth URL received, redirecting...');

      const authWindow = window.open(data.url, '_blank', 'noopener,noreferrer');
      if (authWindow) {
        toast.info('Microsoft sign-in opened in a new tab', {
          description: 'Finish sign-in there, then return here.',
        });
        setConnectingProvider(null);
        return;
      }

      // Fallback if popup/new-tab is blocked
      window.location.assign(data.url);
    } catch (error) {
      console.error('Microsoft OAuth init error:', error);
      toast.error('Failed to connect Microsoft', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    try {
      await disconnectIntegration.mutateAsync(provider);
      toast.success(`${provider === 'google' ? 'Google' : 'Microsoft'} disconnected`);
    } catch {
      toast.error('Failed to disconnect integration');
    }
  };

  const handleSync = async () => {
    try {
      await syncAll();
    } catch {
      // Error toast already shown by hook
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
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
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
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
              <Input 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company or fund name" 
                className="mt-1.5" 
              />
            </div>
            <Button 
              className="gradient-primary text-primary-foreground"
              onClick={handleSaveProfile}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Logo / Branding */}
        <Card className="goldman-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 font-semibold">
              <ImageIcon className="w-4 h-4 text-primary" />
              Company Logo
            </CardTitle>
            <CardDescription>Upload your logo to brand emails, reports, and the sidebar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {getAsset('logo_mark_url') ? (
              <div className="flex items-center gap-4">
                <img
                  src={getAsset('logo_mark_url')!}
                  alt="Company logo"
                  className="h-16 w-16 rounded-lg object-contain border border-border p-1"
                />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Logo uploaded</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeAsset.mutate('logo_mark')}
                    disabled={removeAsset.isPending}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.webp"
                    className="w-auto"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 1 * 1024 * 1024) {
                          toast.error('Logo must be under 1MB');
                          return;
                        }
                        uploadAsset.mutate({ file, assetKey: 'logo_mark' });
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Recommended: 128×128px, PNG or SVG</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="goldman-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 font-semibold">
              <DollarSign className="w-4 h-4 text-primary" />
              Currency
            </CardTitle>
            <CardDescription>Set your preferred currency for displaying amounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Display Currency</Label>
              <Select
                value={profile?.currency || 'USD'}
                onValueChange={(value) => updateCurrency.mutate(value)}
                disabled={updateCurrency.isPending}
              >
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{currency.symbol}</span>
                        <span>{currency.name}</span>
                        <span className="text-muted-foreground">({currency.code})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                This will affect how amounts are displayed in Cap Table and other areas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Email & Calendar Integration */}
        <Card className="goldman-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2 font-semibold">
                  <Mail className="w-4 h-4 text-primary" />
                  Email & Calendar Integration
                </CardTitle>
                <CardDescription>Connect your email and calendar to sync meetings and communications</CardDescription>
              </div>
              {(googleIntegration || microsoftIntegration) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sync Now
                </Button>
              )}
            </div>
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleConnectGoogle}
                      disabled={connectingProvider !== null}
                    >
                      {connectingProvider === 'google' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Link2 className="w-4 h-4 mr-2" />
                      )}
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleConnectMicrosoft}
                      disabled={connectingProvider !== null}
                    >
                      {connectingProvider === 'microsoft' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Link2 className="w-4 h-4 mr-2" />
                      )}
                      Connect
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  Connecting your email and calendar allows Acquire to track communications and sync meetings automatically.
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
