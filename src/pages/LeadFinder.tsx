import React, { useState, useEffect, useMemo } from 'react';
import { useLeads, useLeadsCount, useCreateLead, useDeleteLead, useBulkDeleteLeads, useLeadSearches, useSaveLeadSearch, useDeleteLeadSearch, useConvertLeadToContact, Lead, LeadInsert } from '@/hooks/useLeads';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { BulkActionBar } from '@/components/common/BulkActionBar';
import { EmptyState } from '@/components/common/EmptyState';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { exportToCSV } from '@/lib/csv-export';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Upload, Download, MoreHorizontal, UserPlus, Trash2, Filter, Save, X, ChevronDown, ChevronRight, Target } from 'lucide-react';
import { toast } from 'sonner';
import { AILeadQualification } from '@/components/ai/AILeadQualification';

const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Real Estate', 'Manufacturing', 'Retail', 'Education', 'Legal', 'Consulting', 'Other'];
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'];
const STATUSES = ['new', 'contacted', 'qualified', 'unqualified', 'converted'];

interface Filters {
  search?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  status?: string;
  minScore?: number;
  maxScore?: number;
  tags?: string[];
}

function ScoreBar({ score }: { score: number }) {
  const color = score > 70 ? 'bg-green-500' : score > 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{score}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    qualified: 'bg-green-100 text-green-700',
    unqualified: 'bg-gray-100 text-gray-700',
    converted: 'bg-purple-100 text-purple-700',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${variants[status] || variants.new}`}>{status}</span>;
}

export default function LeadFinder() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [filters, setFilters] = useState<Filters>({});
  const [appliedFilters, setAppliedFilters] = useState<Filters>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [qualifyingLeadId, setQualifyingLeadId] = useState<string | null>(null);

  const { data: leads, isLoading } = useLeads({ ...appliedFilters, page, pageSize });
  const { data: totalCount = 0 } = useLeadsCount(appliedFilters);
  const { data: savedSearches } = useLeadSearches();
  const createLead = useCreateLead();
  const deleteLead = useDeleteLead();
  const bulkDelete = useBulkDeleteLeads();
  const saveSearch = useSaveLeadSearch();
  const deleteSearch = useDeleteLeadSearch();
  const convertToContact = useConvertLeadToContact();

  const [addForm, setAddForm] = useState<LeadInsert>({});

  const sortedLeads = useMemo(() => {
    if (!leads) return [];
    const sorted = [...leads];
    switch (sortBy) {
      case 'name_asc': return sorted.sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''));
      case 'name_desc': return sorted.sort((a, b) => (b.first_name || '').localeCompare(a.first_name || ''));
      case 'score_high': return sorted.sort((a, b) => b.score - a.score);
      case 'score_low': return sorted.sort((a, b) => a.score - b.score);
      case 'oldest': return sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
      default: return sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
  }, [leads, sortBy]);

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setAppliedFilters({});
    setPage(1);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === sortedLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedLeads.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} leads?`)) return;
    bulkDelete.mutate(Array.from(selectedIds), {
      onSuccess: () => { setSelectedIds(new Set()); toast.success('Leads deleted'); },
    });
  };

  const handleExport = () => {
    const data = sortedLeads.filter(l => selectedIds.has(l.id)).map(l => ({
      first_name: l.first_name || '', last_name: l.last_name || '', email: l.email || '',
      title: l.title || '', company: l.company || '', industry: l.industry || '',
      location: l.location || '', score: l.score, status: l.status,
    }));
    exportToCSV(data, 'leads_export');
    toast.success('CSV exported');
  };

  const handleAddLead = () => {
    createLead.mutate(addForm, {
      onSuccess: () => { setShowAddModal(false); setAddForm({}); toast.success('Lead added'); },
    });
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) return;
    saveSearch.mutate({ name: searchName, filters: appliedFilters as Record<string, unknown>, result_count: totalCount }, {
      onSuccess: () => { setShowSaveSearchModal(false); setSearchName(''); toast.success('Search saved'); },
    });
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error('CSV must have a header and at least one row'); return; }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',');
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
        return obj;
      });
      const leadsToImport: LeadInsert[] = rows.map(r => ({
        first_name: r.first_name || r.firstname || null,
        last_name: r.last_name || r.lastname || null,
        email: r.email || null,
        title: r.title || r.job_title || null,
        company: r.company || r.organization || null,
        industry: r.industry || null,
        location: r.location || r.city || null,
        phone: r.phone || null,
        source: 'csv_import',
      }));
      leadsToImport.forEach(lead => createLead.mutate(lead));
      toast.success(`Importing ${leadsToImport.length} leads`);
      setShowImportModal(false);
    };
    reader.readAsText(file);
  };

  if (isLoading) return <div className="p-6"><PageSkeleton type="table" /></div>;

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Filter Sidebar */}
      {showFilters && (
        <div className="w-72 border-r bg-background flex-shrink-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Filters</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowFilters(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {savedSearches && savedSearches.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Saved Searches</Label>
                  <div className="mt-1 space-y-1">
                    {savedSearches.map(s => (
                      <div key={s.id} className="flex items-center justify-between group">
                        <button className="text-xs text-primary hover:underline" onClick={() => { setFilters(s.filters as Filters); setAppliedFilters(s.filters as Filters); }}>
                          {s.name} ({s.result_count})
                        </button>
                        <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => deleteSearch.mutate(s.id)}>
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs">Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Name, email, company..." className="pl-8 h-8 text-sm" value={filters.search || ''} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
                </div>
              </div>

              <div>
                <Label className="text-xs">Industry</Label>
                <Select value={filters.industry || ''} onValueChange={v => setFilters(f => ({ ...f, industry: v || undefined }))}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="All industries" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Company Size</Label>
                <div className="mt-1 space-y-1">
                  {COMPANY_SIZES.map(size => (
                    <label key={size} className="flex items-center gap-2 text-xs cursor-pointer">
                      <Checkbox checked={filters.companySize === size} onCheckedChange={c => setFilters(f => ({ ...f, companySize: c ? size : undefined }))} />
                      {size} employees
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs">Location</Label>
                <Input placeholder="City or state..." className="h-8 text-sm mt-1" value={filters.location || ''} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} />
              </div>

              <div>
                <Label className="text-xs">Status</Label>
                <div className="mt-1 space-y-1">
                  {STATUSES.map(s => (
                    <label key={s} className="flex items-center gap-2 text-xs cursor-pointer capitalize">
                      <Checkbox checked={filters.status === s} onCheckedChange={c => setFilters(f => ({ ...f, status: c ? s : undefined }))} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs">Score Range</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="number" placeholder="Min" className="h-8 text-sm" value={filters.minScore ?? ''} onChange={e => setFilters(f => ({ ...f, minScore: e.target.value ? Number(e.target.value) : undefined }))} />
                  <Input type="number" placeholder="Max" className="h-8 text-sm" value={filters.maxScore ?? ''} onChange={e => setFilters(f => ({ ...f, maxScore: e.target.value ? Number(e.target.value) : undefined }))} />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1" onClick={handleApplyFilters}>Apply Filters</Button>
                <Button size="sm" variant="outline" onClick={handleClearFilters}>Clear</Button>
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={() => setShowSaveSearchModal(true)}>
                <Save className="h-3 w-3 mr-1" /> Save Search
              </Button>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b bg-background">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Lead Finder</h1>
              <p className="text-sm text-muted-foreground">Search, filter, and manage your leads</p>
            </div>
            <div className="flex gap-2">
              {!showFilters && (
                <Button variant="outline" size="sm" onClick={() => setShowFilters(true)}>
                  <Filter className="h-4 w-4 mr-1" /> Filters
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
                <Upload className="h-4 w-4 mr-1" /> Import CSV
              </Button>
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Lead
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{totalCount} leads found</p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="name_asc">Name A-Z</SelectItem>
                <SelectItem value="name_desc">Name Z-A</SelectItem>
                <SelectItem value="score_high">Score: High-Low</SelectItem>
                <SelectItem value="score_low">Score: Low-High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <ScrollArea className="flex-1">
          {sortedLeads.length === 0 ? (
            <EmptyState icon={Search} title="No leads found" description="Start building your lead database by adding leads manually or importing a CSV file." actionLabel="Add Lead" onAction={() => setShowAddModal(true)} />
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-muted/50 border-b">
                <tr className="text-xs text-muted-foreground">
                  <th className="p-3 w-10"><Checkbox checked={selectedIds.size === sortedLeads.length && sortedLeads.length > 0} onCheckedChange={handleSelectAll} /></th>
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Email</th>
                  <th className="p-3 text-left font-medium">Title</th>
                  <th className="p-3 text-left font-medium">Company</th>
                  <th className="p-3 text-left font-medium">Industry</th>
                  <th className="p-3 text-left font-medium">Score</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {sortedLeads.map(lead => (
                  <React.Fragment key={lead.id}>
                  <tr className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3"><Checkbox checked={selectedIds.has(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} /></td>
                    <td className="p-3 font-medium text-sm">{[lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—'}</td>
                    <td className="p-3 text-sm text-muted-foreground">{lead.email || '—'}</td>
                    <td className="p-3 text-sm text-muted-foreground">{lead.title || '—'}</td>
                    <td className="p-3 text-sm">{lead.company || '—'}</td>
                    <td className="p-3">{lead.industry ? <Badge variant="outline" className="text-xs">{lead.industry}</Badge> : '—'}</td>
                    <td className="p-3"><ScoreBar score={lead.score} /></td>
                    <td className="p-3"><StatusBadge status={lead.status} /></td>
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setQualifyingLeadId(qualifyingLeadId === lead.id ? null : lead.id)}><Target className="h-4 w-4 mr-2" /> AI Qualify</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => convertToContact.mutate(lead.id)}><UserPlus className="h-4 w-4 mr-2" /> Convert to Contact</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm('Delete this lead?')) deleteLead.mutate(lead.id); }}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                  {qualifyingLeadId === lead.id && (
                    <tr className="border-b bg-muted/20">
                      <td colSpan={9} className="p-3">
                        <AILeadQualification
                          leadName={[lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown'}
                          leadEmail={lead.email || undefined}
                          leadTitle={lead.title || undefined}
                          leadCompany={lead.company || undefined}
                          leadIndustry={lead.industry || undefined}
                          leadScore={lead.score}
                          entityId={lead.id}
                          onQualified={() => setQualifyingLeadId(null)}
                        />
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </ScrollArea>

        <PaginationControls page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} onPageSizeChange={setPageSize} />

        <BulkActionBar selectedCount={selectedIds.size} onClearSelection={() => setSelectedIds(new Set())} onDelete={handleBulkDelete} onExport={handleExport} />
      </div>

      {/* Add Lead Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Add Lead</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={addForm.first_name || ''} onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={addForm.last_name || ''} onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={addForm.email || ''} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={addForm.phone || ''} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input value={addForm.title || ''} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={addForm.company || ''} onChange={e => setAddForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={addForm.industry || ''} onValueChange={v => setAddForm(f => ({ ...f, industry: v }))}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Company Size</Label>
              <Select value={addForm.company_size || ''} onValueChange={v => setAddForm(f => ({ ...f, company_size: v }))}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{COMPANY_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={addForm.location || ''} onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input value={addForm.linkedin_url || ''} onChange={e => setAddForm(f => ({ ...f, linkedin_url: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddLead} disabled={createLead.isPending}>{createLead.isPending ? 'Adding...' : 'Add Lead'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Import Leads from CSV</DialogTitle></DialogHeader>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">Drag and drop a CSV file or click to browse</p>
            <p className="text-xs text-muted-foreground mb-4">Expected columns: first_name, last_name, email, title, company, industry, location</p>
            <input type="file" accept=".csv" className="hidden" id="csv-upload" onChange={handleImportCSV} />
            <Button variant="outline" onClick={() => document.getElementById('csv-upload')?.click()}>Choose File</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Search Modal */}
      <Dialog open={showSaveSearchModal} onOpenChange={setShowSaveSearchModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Save Search</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Search Name</Label>
            <Input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="E.g., Tech VPs in NYC" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveSearchModal(false)}>Cancel</Button>
            <Button onClick={handleSaveSearch} disabled={!searchName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
