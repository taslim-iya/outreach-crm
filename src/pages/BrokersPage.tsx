import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBrokers, useCreateBroker, useUpdateBroker, useDeleteBroker, useBrokersCount } from '@/hooks/useBrokers';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Plus, Search, Loader2, Trash2, Star, Building, Phone, Mail, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/csv-export';

export default function BrokersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { page, pageSize, setPage, setPageSize } = usePagination();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, setPage]);

  const { data: brokers = [], isLoading } = useBrokers({ search: debouncedSearch, page, pageSize });
  const { data: totalCount = 0 } = useBrokersCount(debouncedSearch);
  const createBroker = useCreateBroker();
  const deleteBroker = useDeleteBroker();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    firm: '', contact_name: '', email: '', phone: '',
    coverage_sector: '', coverage_geo: '', responsiveness_score: 3, notes: '',
  });

  // With server-side search, brokers are already filtered
  const filtered = brokers;

  const handleCreate = () => {
    createBroker.mutate(form as Record<string, unknown>, {
      onSuccess: () => {
        setShowAdd(false);
        setForm({ firm: '', contact_name: '', email: '', phone: '', coverage_sector: '', coverage_geo: '', responsiveness_score: 3, notes: '' });
      }
    });
  };

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Email Accounts"
        description="Manage your sender accounts and email providers"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              const brokerCSVColumns = [
                { key: 'firm' as const, label: 'Firm' },
                { key: 'contact_name' as const, label: 'Contact' },
                { key: 'email' as const, label: 'Email' },
                { key: 'phone' as const, label: 'Phone' },
                { key: 'coverage_sector' as const, label: 'Sector' },
                { key: 'coverage_geo' as const, label: 'Geography' },
                { key: 'responsiveness_score' as const, label: 'Responsiveness' },
                { key: 'notes' as const, label: 'Notes' },
              ];
              exportToCSV(filtered as Record<string, unknown>[], 'brokers.csv', brokerCSVColumns);
            }}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Broker
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search brokers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Firm</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Geography</TableHead>
              <TableHead>Responsiveness</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Building className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-medium">No brokers yet</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Add your first broker contact to start tracking deal flow</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(broker => (
                <TableRow key={broker.id} className="group">
                  <TableCell className="font-medium">{broker.firm}</TableCell>
                  <TableCell>{broker.contact_name}</TableCell>
                  <TableCell className="text-muted-foreground">{broker.coverage_sector || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{broker.coverage_geo || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i <= (broker.responsiveness_score || 0) ? 'text-stage-warm fill-stage-warm' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {broker.email && (
                        <a href={`mailto:${broker.email}`} className="text-muted-foreground hover:text-primary">
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {broker.phone && (
                        <a href={`tel:${broker.phone}`} className="text-muted-foreground hover:text-primary">
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => deleteBroker.mutate(broker.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Broker</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Firm *</Label><Input value={form.firm} onChange={(e) => setForm({...form, firm: e.target.value})} /></div>
              <div><Label>Contact Name *</Label><Input value={form.contact_name} onChange={(e) => setForm({...form, contact_name: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sector Coverage</Label><Input placeholder="e.g., Manufacturing, SaaS" value={form.coverage_sector} onChange={(e) => setForm({...form, coverage_sector: e.target.value})} /></div>
              <div><Label>Geo Coverage</Label><Input placeholder="e.g., Northeast US" value={form.coverage_geo} onChange={(e) => setForm({...form, coverage_geo: e.target.value})} /></div>
            </div>
            <div>
              <Label>Responsiveness (1–5)</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} onClick={() => setForm({...form, responsiveness_score: i})} className="p-0.5">
                    <Star className={`w-5 h-5 ${i <= form.responsiveness_score ? 'text-stage-warm fill-stage-warm' : 'text-muted-foreground/30'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.firm || !form.contact_name || createBroker.isPending}>Add Broker</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
