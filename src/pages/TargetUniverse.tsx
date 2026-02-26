import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany } from '@/hooks/useCompanies';
import { useCreateDeal } from '@/hooks/useDeals';
import { useSavedFilters, useCreateSavedFilter, useDeleteSavedFilter } from '@/hooks/useICMemo';
import { Plus, Search, Filter, Download, Tag, Bookmark, Loader2, Building2, Trash2, X, Upload, ArrowRight, Mail } from 'lucide-react';
import { SmartComposeModal } from '@/components/email/SmartComposeModal';
import { ImportModal } from '@/components/import/ImportModal';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['prospect', 'researching', 'contacted', 'engaged', 'passed', 'archived'];
const OWNERSHIP_OPTIONS = ['private', 'family-owned', 'pe-backed', 'public', 'founder-led', 'estate', 'unknown'];
const REVENUE_BANDS = ['<$1M', '$1-5M', '$5-10M', '$10-25M', '$25-50M', '$50-100M', '$100M+'];
const EBITDA_BANDS = ['<$500K', '$500K-1M', '$1-3M', '$3-5M', '$5-10M', '$10M+'];

export default function TargetUniverse() {
  const { data: companies = [], isLoading } = useCompanies();
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();
  const createDeal = useCreateDeal();
  const { data: savedFilters = [] } = useSavedFilters('company');
  const createSavedFilter = useCreateSavedFilter();
  const deleteSavedFilter = useDeleteSavedFilter();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTag, setBulkTag] = useState('');
  const [showBulkTag, setShowBulkTag] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [outreachCompany, setOutreachCompany] = useState<{ id: string; name: string } | null>(null);

  const handleImportCompanies = async (records: any[]) => {
    for (const record of records) {
      await createCompany.mutateAsync({
        name: record.name || 'Unknown',
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
        company_status: record.company_status || 'prospect',
        company_source: record.company_source || 'import',
        company_tags: record.company_tags || [],
      } as any);
    }
  };

  // Form state
  const [form, setForm] = useState({
    name: '', industry: '', geography: '', website: '', description: '',
    sic_code: '', naics_code: '', ownership_type: '', revenue_band: '', ebitda_band: '',
    employee_count: '', company_status: 'prospect', company_source: '', company_tags: '',
  });

  const filtered = useMemo(() => {
    return companies.filter((c: any) => {
      const matchesSearch = !search || 
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.industry?.toLowerCase().includes(search.toLowerCase()) ||
        c.geography?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.company_status === statusFilter;
      const matchesOwnership = ownershipFilter === 'all' || c.ownership_type === ownershipFilter;
      return matchesSearch && matchesStatus && matchesOwnership;
    });
  }, [companies, search, statusFilter, ownershipFilter]);

  const handleAdd = () => {
    const tags = form.company_tags ? form.company_tags.split(',').map(t => t.trim()) : [];
    createCompany.mutate({
      name: form.name,
      industry: form.industry || null,
      geography: form.geography || null,
      website: form.website || null,
    } as any, {
      onSuccess: () => {
        setShowAddModal(false);
        setForm({ name: '', industry: '', geography: '', website: '', description: '', sic_code: '', naics_code: '', ownership_type: '', revenue_band: '', ebitda_band: '', employee_count: '', company_status: 'prospect', company_source: '', company_tags: '' });
      }
    });
  };

  const handleBulkTag = () => {
    if (!bulkTag.trim()) return;
    selectedIds.forEach(id => {
      const company = companies.find((c: any) => c.id === id);
      if (company) {
        const existing = (company as any).company_tags || [];
        const updated = [...new Set([...existing, bulkTag.trim()])];
        updateCompany.mutate({ id, company_tags: updated } as any);
      }
    });
    setSelectedIds(new Set());
    setBulkTag('');
    setShowBulkTag(false);
    toast.success(`Tag "${bulkTag}" applied to ${selectedIds.size} companies`);
  };

  const handleExportCSV = () => {
    const rows = filtered.map((c: any) => ({
      Name: c.name, Industry: c.industry, Geography: c.geography,
      Status: c.company_status, 'Revenue Band': c.revenue_band,
      'EBITDA Band': c.ebitda_band, Source: c.company_source,
    }));
    const csv = [Object.keys(rows[0] || {}).join(','), ...rows.map(r => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'target-universe.csv';
    a.click();
    toast.success('Exported CSV');
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c: any) => c.id)));
    }
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
        title="Target Universe"
        description="Search, filter, and manage your acquisition targets"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <Upload className="w-4 h-4 mr-1" /> Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filtered.length === 0}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Company
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name, industry, geography..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Ownership" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {OWNERSHIP_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div className="flex items-center gap-1">
            <Bookmark className="w-4 h-4 text-muted-foreground" />
            {savedFilters.map((f: any) => (
              <Badge
                key={f.id}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => {
                  const cfg = f.filter_config;
                  if (cfg.search) setSearch(cfg.search);
                  if (cfg.status) setStatusFilter(cfg.status);
                  if (cfg.ownership) setOwnershipFilter(cfg.ownership);
                }}
              >
                {f.name}
                <button className="ml-1" onClick={(e) => { e.stopPropagation(); deleteSavedFilter.mutate(f.id); }}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setShowSaveFilter(true)}>
          <Bookmark className="w-4 h-4 mr-1" /> Save View
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-muted border border-border">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button variant="outline" size="sm" onClick={() => setShowBulkTag(true)}>
            <Tag className="w-3.5 h-3.5 mr-1" /> Add Tag
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Geography</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <Building2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-medium">No companies found</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Add your first target company to get started</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c: any) => (
                <TableRow key={c.id} className="group">
                  <TableCell>
                    <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded" />
                  </TableCell>
                  <TableCell>
                    <a href={`/company/${c.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                      {c.name}
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.industry || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{c.geography || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize text-xs">{c.company_status || 'prospect'}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.revenue_band || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{c.company_source || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(c.company_tags || []).slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-[10px] px-1.5">{tag}</Badge>
                      ))}
                      {(c.company_tags || []).length > 2 && (
                        <Badge variant="outline" className="text-[10px] px-1.5">+{c.company_tags.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="AI Outreach"
                        onClick={() => setOutreachCompany({ id: c.id, name: c.name })}
                      >
                        <Mail className="w-3.5 h-3.5 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Move to Deal Pipeline"
                        onClick={() => {
                          createDeal.mutate({
                            name: c.name,
                            company_id: c.id,
                            source: c.company_source || 'proprietary',
                            stage: 'screening' as any,
                          }, {
                            onSuccess: () => toast.success(`${c.name} added to Deal Pipeline`),
                          });
                        }}
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteCompany.mutate(c.id)}>
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

      <p className="text-xs text-muted-foreground mt-2">{filtered.length} of {companies.length} companies</p>

      {/* Add Company Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Target Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Company Name *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
              <div><Label>Industry</Label><Input value={form.industry} onChange={(e) => setForm({...form, industry: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Geography</Label><Input value={form.geography} onChange={(e) => setForm({...form, geography: e.target.value})} /></div>
              <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({...form, website: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Source</Label><Input placeholder="e.g., broker, proprietary" value={form.company_source} onChange={(e) => setForm({...form, company_source: e.target.value})} /></div>
              <div>
                <Label>Ownership Type</Label>
                <Select value={form.ownership_type} onValueChange={(v) => setForm({...form, ownership_type: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {OWNERSHIP_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Revenue Band</Label>
                <Select value={form.revenue_band} onValueChange={(v) => setForm({...form, revenue_band: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {REVENUE_BANDS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>EBITDA Band</Label>
                <Select value={form.ebitda_band} onValueChange={(v) => setForm({...form, ebitda_band: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {EBITDA_BANDS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Tags (comma-separated)</Label><Input placeholder="software, Q1 outreach" value={form.company_tags} onChange={(e) => setForm({...form, company_tags: e.target.value})} /></div>
            <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.name || createCompany.isPending}>
              {createCompany.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              Add Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Filter Modal */}
      <Dialog open={showSaveFilter} onOpenChange={setShowSaveFilter}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Save Current View</DialogTitle></DialogHeader>
          <div><Label>View Name</Label><Input value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="e.g., Top 50 Software" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveFilter(false)}>Cancel</Button>
            <Button onClick={() => {
              createSavedFilter.mutate({
                name: filterName,
                entity_type: 'company',
                filter_config: { search, status: statusFilter, ownership: ownershipFilter },
              });
              setShowSaveFilter(false);
              setFilterName('');
            }} disabled={!filterName}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Tag Modal */}
      <Dialog open={showBulkTag} onOpenChange={setShowBulkTag}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Tag to {selectedIds.size} Companies</DialogTitle></DialogHeader>
          <div><Label>Tag Name</Label><Input value={bulkTag} onChange={(e) => setBulkTag(e.target.value)} placeholder="e.g., Q1 Outreach" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkTag(false)}>Cancel</Button>
            <Button onClick={handleBulkTag} disabled={!bulkTag}>Apply Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Modal */}
      <ImportModal
        open={showImport}
        onOpenChange={setShowImport}
        entityType="companies"
        onImport={handleImportCompanies}
      />

      {/* AI Outreach Modal */}
      <SmartComposeModal
        open={!!outreachCompany}
        onOpenChange={(open) => !open && setOutreachCompany(null)}
        companyId={outreachCompany?.id}
        companyName={outreachCompany?.name}
      />
    </div>
  );
}
