import { useState, useMemo, useCallback } from 'react';
import { InvestorFormModal } from '@/components/pipeline/InvestorFormModal';
import { DeleteInvestorDialog } from '@/components/pipeline/DeleteInvestorDialog';
import { CommitmentAmountModal } from '@/components/pipeline/CommitmentAmountModal';
import { InvestorUpdateModal } from '@/components/updates/InvestorUpdateModal';
import { BulkEmailModal } from '@/components/pipeline/BulkEmailModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInvestorDeals, InvestorDeal, InvestorStage, useUpdateInvestorStage, useUpdateInvestorStageWithCommitment } from '@/hooks/useInvestorDeals';
import { Plus, Search, Loader2, TrendingUp, FileText, Mail, Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SortField = 'name' | 'organization' | 'stage' | 'commitment_amount' | 'investor_type' | 'geography' | 'notes';
type SortDir = 'asc' | 'desc';

const stages: { key: InvestorStage; label: string; color: string }[] = [
  { key: 'not_contacted', label: 'Not Contacted', color: 'bg-stage-cold' },
  { key: 'outreach_sent', label: 'Outreach Sent', color: 'bg-info' },
  { key: 'follow_up', label: 'Follow-up', color: 'bg-stage-warm' },
  { key: 'meeting_scheduled', label: 'Meeting Scheduled', color: 'bg-primary' },
  { key: 'interested', label: 'Interested', color: 'bg-success' },
  { key: 'committed', label: 'Committed', color: 'bg-success' },
  { key: 'passed', label: 'Passed', color: 'bg-stage-passed' },
  { key: 'closed', label: 'Closed', color: 'bg-success' },
];

const stageLabels: Record<InvestorStage, string> = {
  not_contacted: 'Not Contacted',
  outreach_sent: 'Outreach Sent',
  follow_up: 'Follow-up',
  meeting_scheduled: 'Meeting Scheduled',
  interested: 'Interested',
  passed: 'Passed',
  committed: 'Committed',
  closed: 'Closed',
};

const stageColors: Record<InvestorStage, string> = {
  not_contacted: 'bg-stage-cold',
  outreach_sent: 'bg-info',
  follow_up: 'bg-stage-warm',
  meeting_scheduled: 'bg-primary',
  interested: 'bg-success',
  passed: 'bg-stage-passed',
  committed: 'bg-success',
  closed: 'bg-success',
};

export default function Investors() {
  const { user } = useAuth();
  const { data: investors = [], isLoading } = useInvestorDeals();
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const updateStage = useUpdateInvestorStage();
  const updateStageWithCommitment = useUpdateInvestorStageWithCommitment();

  const [commitmentModalOpen, setCommitmentModalOpen] = useState(false);
  const [pendingDeal, setPendingDeal] = useState<InvestorDeal | null>(null);
  const [pendingStage, setPendingStage] = useState<'committed' | 'closed' | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('company_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const companyName = profile?.company_name;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<InvestorDeal | null>(null);
  const [defaultStage, setDefaultStage] = useState<InvestorStage>('not_contacted');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }, [sortField]);

  const filtered = useMemo(() => {
    let result = investors.filter((inv) => {
      const matchesSearch =
        !searchQuery ||
        inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        ((inv as any).investor_type?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        ((inv as any).geography?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesStage = stageFilter === 'all' || inv.stage === stageFilter;
      return matchesSearch && matchesStage;
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = ((a as any)[sortField] ?? '') as string;
        const bVal = ((b as any)[sortField] ?? '') as string;
        if (sortField === 'commitment_amount') {
          const aNum = (a.commitment_amount ?? 0);
          const bNum = (b.commitment_amount ?? 0);
          return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
        }
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { sensitivity: 'base' });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [investors, searchQuery, stageFilter, sortField, sortDir]);

  const selectedInvestors = investors.filter(i => selectedIds.has(i.id));

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(i => i.id)));
    }
  };

  const handleStageChange = async (investor: InvestorDeal, newStage: InvestorStage) => {
    if (newStage === investor.stage) return;
    if (newStage === 'committed' || newStage === 'closed') {
      setPendingDeal(investor);
      setPendingStage(newStage);
      setCommitmentModalOpen(true);
      return;
    }
    try {
      await updateStage.mutateAsync({ id: investor.id, stage: newStage });
      toast.success(`Moved to ${stageLabels[newStage]}`);
    } catch {
      toast.error('Failed to update stage');
    }
  };

  const handleCommitmentConfirm = async (amount: number) => {
    if (!pendingDeal || !pendingStage) return;
    try {
      await updateStageWithCommitment.mutateAsync({
        id: pendingDeal.id,
        stage: pendingStage,
        commitment_amount: amount,
      });
      toast.success(`Moved to ${stageLabels[pendingStage]}`);
      setCommitmentModalOpen(false);
      setPendingDeal(null);
      setPendingStage(null);
    } catch {
      toast.error('Failed to update stage');
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title={companyName ? `${companyName} Investor Pipeline` : 'Investor Pipeline'}
        description="Track your fundraising progress"
        actions={
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button variant="outline" size="sm" onClick={() => setIsBulkEmailOpen(true)}>
                <Mail className="w-4 h-4 mr-1" />
                Email {selectedIds.size} Selected
              </Button>
            )}
            {selectedIds.size > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-muted-foreground">
                Clear
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsUpdateOpen(true)}>
              <FileText className="w-4 h-4 mr-1" />
              Send Update
            </Button>
            <Button size="sm" onClick={() => { setSelectedInvestor(null); setDefaultStage('not_contacted'); setIsFormOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" />
              Add Investor
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name, organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map((s) => (
              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </TableHead>
              {([
                ['name', 'Name'],
                ['organization', 'Organization'],
                ['investor_type', 'Investor Type'],
                ['geography', 'Geography'],
                ['stage', 'Stage'],
                ['commitment_amount', 'Commitment'],
                ['notes', 'Notes'],
              ] as [SortField, string][]).map(([field, label]) => (
                <TableHead key={field}>
                  <button
                    type="button"
                    onClick={() => handleSort(field)}
                    className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer select-none"
                  >
                    {label}
                    {sortField === field ? (
                      sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </button>
                </TableHead>
              ))}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <TrendingUp className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-medium">No investors found</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Add your first investor to get started</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv) => (
                <TableRow key={inv.id} className="group">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(inv.id)}
                      onChange={() => toggleSelect(inv.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-foreground">{inv.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{inv.organization || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{(inv as any).investor_type || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{(inv as any).geography || '—'}</TableCell>
                  <TableCell>
                    <Select
                      value={inv.stage}
                      onValueChange={(val) => handleStageChange(inv, val as InvestorStage)}
                    >
                      <SelectTrigger className="h-7 w-[160px] border-none bg-transparent p-0 shadow-none focus:ring-0">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${stageColors[inv.stage] || ''}`} />
                          <span className="text-xs">{stageLabels[inv.stage]}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map((s) => (
                          <SelectItem key={s.key} value={s.key}>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${s.color}`} />
                              {s.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCurrency(inv.commitment_amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {inv.notes || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => { setSelectedInvestor(inv); setIsFormOpen(true); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => { setSelectedInvestor(inv); setIsDeleteOpen(true); }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground mt-2">{filtered.length} of {investors.length} investors</p>

      {/* Modals */}
      <InvestorFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        investor={selectedInvestor}
        defaultStage={defaultStage}
      />
      <DeleteInvestorDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        investor={selectedInvestor}
      />
      <CommitmentAmountModal
        open={commitmentModalOpen}
        onOpenChange={(open) => {
          setCommitmentModalOpen(open);
          if (!open) { setPendingDeal(null); setPendingStage(null); }
        }}
        investor={pendingDeal}
        targetStage={pendingStage || 'committed'}
        onConfirm={handleCommitmentConfirm}
        isLoading={updateStageWithCommitment.isPending}
      />
      <InvestorUpdateModal open={isUpdateOpen} onOpenChange={setIsUpdateOpen} />
      <BulkEmailModal
        open={isBulkEmailOpen}
        onOpenChange={(open) => {
          setIsBulkEmailOpen(open);
          if (!open) setSelectedIds(new Set());
        }}
        investors={selectedInvestors}
      />
    </div>
  );
}
