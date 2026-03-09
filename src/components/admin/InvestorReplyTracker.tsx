import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminInvestorReplies, InvestorReplyStatus } from '@/hooks/useAdminInvestorReplies';
import { Loader2, CheckCircle2, Clock, UserX, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

const STATUS_CONFIG = {
  replied: { label: 'Replied', icon: CheckCircle2, variant: 'default' as const, color: 'text-green-600' },
  pending: { label: 'Pending', icon: Clock, variant: 'secondary' as const, color: 'text-amber-500' },
  not_contacted: { label: 'Not Contacted', icon: UserX, variant: 'outline' as const, color: 'text-muted-foreground' },
};

function InvestorTable({ investors }: { investors: InvestorReplyStatus[] }) {
  if (investors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Users className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-sm">No investors in this category</p>
      </div>
    );
  }

  return (
    <div className="max-h-[500px] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Investor</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Contact Email</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Last Outbound</TableHead>
            <TableHead>Reply At</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investors.map((inv) => {
            const cfg = STATUS_CONFIG[inv.reply_status];
            const Icon = cfg.icon;
            return (
              <TableRow key={inv.investor_deal_id}>
                <TableCell className="font-medium text-sm">{inv.investor_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{inv.organization || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{inv.contact_email || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-[160px]">{inv.owner_email || '—'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {inv.stage.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {inv.last_outbound_at ? format(new Date(inv.last_outbound_at), 'MMM d, yyyy') : '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {inv.first_inbound_after_outbound_at
                    ? format(new Date(inv.first_inbound_after_outbound_at), 'MMM d, yyyy')
                    : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function InvestorReplyTracker() {
  const { data: investors = [], isLoading } = useAdminInvestorReplies();
  const [search, setSearch] = useState('');

  const filtered = investors.filter(
    (i) =>
      i.investor_name.toLowerCase().includes(search.toLowerCase()) ||
      (i.organization || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.contact_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.owner_email || '').toLowerCase().includes(search.toLowerCase())
  );

  const replied = filtered.filter((i) => i.reply_status === 'replied');
  const pending = filtered.filter((i) => i.reply_status === 'pending');
  const notContacted = filtered.filter((i) => i.reply_status === 'not_contacted');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="goldman-card">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Users className="w-4 h-4" />
          Investor Reply Tracker
          <Badge variant="outline" className="ml-2 text-[10px]">All Users</Badge>
        </CardTitle>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="default">{replied.length} Replied</Badge>
            <Badge variant="secondary">{pending.length} Pending</Badge>
            <Badge variant="outline">{notContacted.length} Not Contacted</Badge>
          </div>
          <Input
            placeholder="Search investors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[200px] h-8 text-xs"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="replied">Replied ({replied.length})</TabsTrigger>
            <TabsTrigger value="not_contacted">Not Contacted ({notContacted.length})</TabsTrigger>
            <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending"><InvestorTable investors={pending} /></TabsContent>
          <TabsContent value="replied"><InvestorTable investors={replied} /></TabsContent>
          <TabsContent value="not_contacted"><InvestorTable investors={notContacted} /></TabsContent>
          <TabsContent value="all"><InvestorTable investors={filtered} /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
