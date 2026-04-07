import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Flame,
  Plus,
  Mail,
  Shield,
  TrendingUp,
  AlertTriangle,
  Trash2,
  Settings,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import {
  useEmailWarmupAccounts,
  useCreateWarmupAccount,
  useUpdateWarmupAccount,
  useDeleteWarmupAccount,
  useWarmupDailyStats,
  type EmailWarmupAccount,
  type WarmupReputation,
  type WarmupProvider,
} from '@/hooks/useEmailWarmup';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REPUTATION_CONFIG: Record<WarmupReputation, { label: string; color: string }> = {
  excellent: { label: 'Excellent', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  good: { label: 'Good', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  fair: { label: 'Fair', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  poor: { label: 'Poor', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

function healthScoreColor(score: number): string {
  if (score > 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function healthProgressColor(score: number): string {
  if (score > 80) return '[&>div]:bg-emerald-500';
  if (score >= 60) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-red-500';
}

function providerIcon(provider: string) {
  if (provider === 'microsoft') {
    return (
      <svg viewBox="0 0 21 21" className="h-4 w-4 shrink-0" aria-hidden="true">
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function pct(num: number, den: number): string {
  if (den === 0) return '0';
  return ((num / den) * 100).toFixed(1);
}

// ─── Account Detail (expanded) ────────────────────────────────────────────────

function AccountDetail({
  account,
  onClose,
}: {
  account: EmailWarmupAccount;
  onClose: () => void;
}) {
  const { data: dailyStats = [], isLoading } = useWarmupDailyStats(account.id, 30);
  const updateMutation = useUpdateWarmupAccount();
  const deleteMutation = useDeleteWarmupAccount();

  const [dailyRampup, setDailyRampup] = useState(String(account.daily_rampup));
  const [maxDailySends, setMaxDailySends] = useState(String(account.max_daily_sends));

  const chartData = useMemo(
    () =>
      dailyStats.map((d) => ({
        date: d.date,
        Sent: d.sent,
        Inbox: d.landed_inbox,
        Spam: d.landed_spam,
      })),
    [dailyStats],
  );

  function handleSave() {
    const rampup = parseInt(dailyRampup, 10);
    const max = parseInt(maxDailySends, 10);
    if (isNaN(rampup) || isNaN(max) || rampup < 1 || max < 1) {
      toast.error('Please enter valid positive numbers');
      return;
    }
    updateMutation.mutate({ id: account.id, daily_rampup: rampup, max_daily_sends: max });
  }

  function handleDisable() {
    updateMutation.mutate({ id: account.id, warmup_enabled: false });
  }

  function handleRemove() {
    deleteMutation.mutate(account.id, { onSuccess: onClose });
  }

  return (
    <div className="mt-4 space-y-6 border-t pt-6">
      {/* Chart */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Last 30 Days Activity</h4>
        {isLoading ? (
          <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
            Loading stats...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
            No daily data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickFormatter={(v: string) => {
                  const d = new Date(v + 'T00:00:00');
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="Sent"
                stackId="1"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.15}
              />
              <Area
                type="monotone"
                dataKey="Inbox"
                stackId="2"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.15}
              />
              <Area
                type="monotone"
                dataKey="Spam"
                stackId="3"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Settings */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`rampup-${account.id}`}>Daily rampup increment</Label>
          <Input
            id={`rampup-${account.id}`}
            type="number"
            min={1}
            value={dailyRampup}
            onChange={(e) => setDailyRampup(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`max-${account.id}`}>Max daily sends</Label>
          <Input
            id={`max-${account.id}`}
            type="number"
            min={1}
            value={maxDailySends}
            onChange={(e) => setMaxDailySends(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Settings className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
        <Button
          variant="outline"
          onClick={handleDisable}
          disabled={updateMutation.isPending || !account.warmup_enabled}
        >
          Disable Warmup
        </Button>
        <Button
          variant="destructive"
          onClick={handleRemove}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove Account
        </Button>
      </div>
    </div>
  );
}

// ─── Account Card ─────────────────────────────────────────────────────────────

function AccountCard({ account }: { account: EmailWarmupAccount }) {
  const [expanded, setExpanded] = useState(false);
  const updateMutation = useUpdateWarmupAccount();

  const rep = REPUTATION_CONFIG[account.reputation] ?? REPUTATION_CONFIG.good;
  const inboxPct = pct(account.total_landed_inbox, account.total_sent);
  const spamPct = pct(account.total_landed_spam, account.total_sent);
  const bouncePct = pct(account.total_bounced, account.total_sent);

  function handleToggle(checked: boolean) {
    updateMutation.mutate({ id: account.id, warmup_enabled: checked });
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex items-center gap-3 min-w-0 cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            {providerIcon(account.provider)}
            <div className="min-w-0">
              <CardTitle className="text-sm font-medium truncate">
                {account.email_account}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {account.provider}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge className={rep.color} variant="secondary">
              {rep.label}
            </Badge>
            <Switch
              checked={account.warmup_enabled}
              onCheckedChange={handleToggle}
              aria-label="Toggle warmup"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent
        className="cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Health score bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Health Score</span>
            <span className={`text-sm font-semibold ${healthScoreColor(account.health_score)}`}>
              {account.health_score}%
            </span>
          </div>
          <Progress
            value={account.health_score}
            className={`h-2 ${healthProgressColor(account.health_score)}`}
          />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-lg font-semibold">{account.total_sent}</p>
            <p className="text-[11px] text-muted-foreground">Sent</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              {inboxPct}%
            </p>
            <p className="text-[11px] text-muted-foreground">Inbox</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">
              {spamPct}%
            </p>
            <p className="text-[11px] text-muted-foreground">Spam</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              {bouncePct}%
            </p>
            <p className="text-[11px] text-muted-foreground">Bounce</p>
          </div>
        </div>

        {/* Daily limit */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
          <span>Current daily limit</span>
          <span className="font-medium text-foreground">
            {account.current_daily_limit} / {account.max_daily_sends}
          </span>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <AccountDetail
            account={account}
            onClose={() => setExpanded(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmailWarmup() {
  const { data: accounts = [], isLoading } = useEmailWarmupAccounts();
  const createMutation = useCreateWarmupAccount();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newProvider, setNewProvider] = useState<WarmupProvider>('google');
  const [newRampup, setNewRampup] = useState('5');
  const [newMaxSends, setNewMaxSends] = useState('50');

  // ── Aggregated stats ──────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = accounts.length;
    const avgHealth =
      total > 0 ? Math.round(accounts.reduce((s, a) => s + a.health_score, 0) / total) : 0;
    const totalSent = accounts.reduce((s, a) => s + a.total_sent, 0);
    const totalInbox = accounts.reduce((s, a) => s + a.total_landed_inbox, 0);
    const avgInboxRate = totalSent > 0 ? ((totalInbox / totalSent) * 100).toFixed(1) : '0';
    return { total, avgHealth, totalSent, avgInboxRate };
  }, [accounts]);

  // ── Add account handler ───────────────────────────────────────────────────

  function handleCreate() {
    if (!newEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    const rampup = parseInt(newRampup, 10);
    const max = parseInt(newMaxSends, 10);
    if (isNaN(rampup) || isNaN(max) || rampup < 1 || max < 1) {
      toast.error('Please enter valid positive numbers');
      return;
    }
    createMutation.mutate(
      {
        email_account: newEmail.trim(),
        provider: newProvider,
        daily_rampup: rampup,
        max_daily_sends: max,
        current_daily_limit: rampup,
      },
      {
        onSuccess: () => {
          setShowAddDialog(false);
          setNewEmail('');
          setNewProvider('google');
          setNewRampup('5');
          setNewMaxSends('50');
        },
      },
    );
  }

  // ── Circular health indicator for stats card ──────────────────────────────

  function CircularHealth({ score }: { score: number }) {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const stroke =
      score > 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';

    return (
      <svg width="88" height="88" className="mx-auto">
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="6"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
          className="transition-all duration-500"
        />
        <text
          x="44"
          y="44"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-lg font-bold"
          fontSize="18"
        >
          {score}
        </text>
      </svg>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Email Warmup"
        description="Monitor and improve your email deliverability"
        actions={
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        }
      />

      {/* Stats Overview */}
      {accounts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Accounts</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-2">Avg Health Score</p>
                <CircularHealth score={stats.avgHealth} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-500/10 p-2.5">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Emails Sent</p>
                  <p className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2.5">
                  <Shield className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Inbox Rate</p>
                  <p className="text-2xl font-bold">{stats.avgInboxRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Account Cards Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-5 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-2 bg-muted rounded" />
                  <div className="h-10 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        /* Empty State */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-4 mb-4">
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No email accounts warming up</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Add your first email account to start building sender reputation
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      {/* Add Account Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Warmup Account</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="warmup-email">Email address</Label>
              <Input
                id="warmup-email"
                type="email"
                placeholder="you@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warmup-provider">Provider</Label>
              <Select
                value={newProvider}
                onValueChange={(v) => setNewProvider(v as WarmupProvider)}
              >
                <SelectTrigger id="warmup-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="microsoft">Microsoft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warmup-rampup">Daily rampup increment</Label>
                <Input
                  id="warmup-rampup"
                  type="number"
                  min={1}
                  value={newRampup}
                  onChange={(e) => setNewRampup(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warmup-max">Max daily sends</Label>
                <Input
                  id="warmup-max"
                  type="number"
                  min={1}
                  value={newMaxSends}
                  onChange={(e) => setNewMaxSends(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              <Flame className="h-4 w-4 mr-2" />
              Start Warmup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
