import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lovable } from '@/integrations/lovable/index';
import { useBrandSettings } from '@/hooks/useBrandSettings';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/hooks/useDemoMode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Loader2, ArrowRight, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/brand/BrandLogo';

export default function Auth() {
  const { getSiteTitle, getMetaDescription, getAsset, settings } = useBrandSettings();
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { enterDemoMode } = useDemoMode();
  const [loading, setLoading] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(loginEmail, loginPassword);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
      navigate('/');
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created successfully!');
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'var(--gradient-primary)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_50%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Brand logo on login page */}
          <BrandLogo
            variant="light"
            titleClassName="text-xl text-white"
            iconClassName="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white"
          />
          
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">
              The modern CRM for<br />
              acquisition entrepreneurs
            </h1>
            <p className="text-lg text-white/70 max-w-md leading-relaxed">
              Manage your cold email outreach, track leads, and close deals faster with AI-powered automation.
            </p>
          </div>

          <p className="text-sm text-white/40">© 2026 Acquire CRM. Built for acquisition entrepreneurs.</p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo on login page */}
          <div className="lg:hidden flex justify-center mb-8">
            <BrandLogo
              variant="full"
              titleClassName="text-xl"
              iconClassName="w-10 h-10 rounded-xl bg-primary text-primary-foreground"
            />
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2 pt-8">
              <CardTitle className="text-2xl font-semibold tracking-tight">Welcome</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to manage your acquisition journey
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="font-medium">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="font-medium">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-11"
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={() => {
                  enterDemoMode();
                  navigate('/');
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Continue as Guest
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Explore with sample data — read-only mode
              </p>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our{' '}
            <a href="/terms" className="underline hover:text-foreground transition-colors">Terms of Service</a> and{' '}
            <a href="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
