import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeals, useCreateDeal, useUpdateDealStage, useDeleteDeal, DEAL_STAGES, DEAL_STAGE_LABELS } from '@/hooks/useDeals';
import { useCompanies } from '@/hooks/useCompanies';
import { useBrokers } from '@/hooks/useBrokers';
import { Plus, Search, Loader2, LayoutGrid, List, Trash2, ArrowRight, Upload } from 'lucide-react';
import { ImportModal } from '@/components/import/ImportModal';
import { useCreateCompany } from '@/hooks/useCompanies';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const STAGE_COLORS: Record<string, string> = {
  screening: 'bg-muted text-muted-foreground',
  contacted: 'bg-info/10 text-info',
  teaser: 'bg-stage-warm/10 text-stage-warm',
  cim: 'bg-stage-warm/20 text-stage-warm',
  ioi: 'bg-primary/10 text-primary',
  loi: 'bg-primary/20 text-primary',
  dd: 'bg-success/10 text-success',
  financing: 'bg-success/20 text-success',
  signing: 'bg-success/30 text-success',
  closed_won: 'bg-success text-success-foreground',
  lost: 'bg-destructive/10 text-destructive',
};

export default function DealSourcingDeals() {
  const { data: deals = [], isLoading } = useDeals();
  const { data: companies = [] } = useCompanies();
  const { data: brokers = [] } = useBrokers();
  const createDeal = useCreateDeal();
  const updateStage = useUpdateDealStage();
  const deleteDeal = useDeleteDeal();

  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const createCompany = useCreateCompany();
  const [form, setForm] = useState({ name: '', company_id: '', broker_id: '', source: 'proprietary', stage: 'screening' });

  const handleImportCompanies = async (records: any[]) => {
    for (const record of records) {
      await createCompany.mutateAsync({
        name: record.name,
        industry: record.industry || null,
        geography: record.geography || null,
        website: record.website || null,
        description: record.description || null,
        sic_code: record.sic_code || null,
        naics_code: record.naics_code || null,
        ownership_type: record.ownership_type || null,
        revenue_band: record.revenue_band || null,
        ebitda_band: record.ebitda_band || null,
        employee_count: record.employee_count || null,
        company_status: record.company_status || null,
        company_source: record.company_source || null,
        company_tags: record.company_tags || [],
      });
    }
  };

  const filtered = useMemo(() => {
    if (!search) return deals;
    return deals.filter(d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.companies?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [deals, search]);

  const stageGroups = useMemo(() => {
    const groups: Record<string, typeof deals> = {};
    // Only show active pipeline stages in kanban (not lost)
    const kanbanStages = DEAL_STAGES.filter(s => s !== 'lost');
    kanbanStages.forEach(s => { groups[s] = []; });
    filtered.forEach(d => {
      if (groups[d.stage]) groups[d.stage].push(d);
      else if (d.stage === 'lost') { /* skip lost in kanban */ }
    });
    return groups;
  }, [filtered]);

  const handleCreate = () => {
    createDeal.mutate({
      name: form.name,
      company_id: form.company_id || null,
      broker_id: form.broker_id || null,
      source: form.source,
      stage: form.stage as any,
    }, {
      onSuccess: () => {
        setShowAdd(false);
        setForm({ name: '', company_id: '', broker_id: '', source: 'proprietary', stage: 'screening' });
      }
    });
  };

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Deal Pipeline"
        description="Track acquisitions from screening to close"
        actions={
          <div className="flex gap-2">
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button variant={view === 'kanban' ? 'default' : 'ghost'} size="sm" onClick={() => setView('kanban')} className="rounded-none">
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button variant={view === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setView('table')} className="rounded-none">
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="w-4 h-4 mr-1" /> Import
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Deal
            </Button>
          </div>
        }
      />

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search deals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {Object.entries(stageGroups).map(([stage, stageDeals]) => (
            <div key={stage} className="flex-shrink-0 w-[220px]">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {DEAL_STAGE_LABELS[stage]}
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5">{stageDeals.length}</Badge>
              </div>
              <div className="space-y-2 min-h-[100px] p-1.5 rounded-lg bg-muted/30 border border-border/50">
                {stageDeals.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/50 text-center py-6">No deals</p>
                ) : (
                  stageDeals.map(deal => (
                    <a key={deal.id} href={`/deal/${deal.id}`} className="block">
                      <Card className="goldman-card cursor-pointer p-3">
                        <p className="text-sm font-medium text-foreground truncate">{deal.name}</p>
                        {deal.companies?.name && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{deal.companies.name}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-[10px] capitalize">{deal.source || 'proprietary'}</Badge>
                          {deal.probability != null && (
                            <span className="text-[10px] text-muted-foreground">{deal.probability}%</span>
                          )}
                        </div>
                      </Card>
                    </a>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Probability</TableHead>
                <TableHead>Expected Close</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <p className="text-muted-foreground font-medium">No deals yet</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">Create your first deal to start tracking</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(deal => (
                  <TableRow key={deal.id} className="group">
                    <TableCell>
                      <a href={`/deal/${deal.id}`} className="font-medium text-foreground hover:text-primary">{deal.name}</a>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{deal.companies?.name || '—'}</TableCell>
                    <TableCell>
                      <Badge className={cn('text-[10px] capitalize', STAGE_COLORS[deal.stage])}>
                        {DEAL_STAGE_LABELS[deal.stage]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground capitalize">{deal.source || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{deal.probability != null ? `${deal.probability}%` : '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {deal.expected_close_date ? format(new Date(deal.expected_close_date), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => deleteDeal.mutate(deal.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Deal Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Deal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Deal Name *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g., Acme Corp Acquisition" /></div>
            <div>
              <Label>Linked Company</Label>
              <Select value={form.company_id} onValueChange={(v) => setForm({...form, company_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select company..." /></SelectTrigger>
                <SelectContent>
                  {companies.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Broker</Label>
              <Select value={form.broker_id} onValueChange={(v) => setForm({...form, broker_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select broker..." /></SelectTrigger>
                <SelectContent>
                  {brokers.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.firm} — {b.contact_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({...form, source: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proprietary">Proprietary</SelectItem>
                    <SelectItem value="brokered">Brokered</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Starting Stage</Label>
                <Select value={form.stage} onValueChange={(v) => setForm({...form, stage: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEAL_STAGES.map(s => <SelectItem key={s} value={s}>{DEAL_STAGE_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name || createDeal.isPending}>
              {createDeal.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Create Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportModal
        open={showImport}
        onOpenChange={setShowImport}
        entityType="companies"
        onImport={handleImportCompanies}
      />
    </div>
  );
}
