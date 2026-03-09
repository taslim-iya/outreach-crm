import { useState, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ContactFormModal } from '@/components/contacts/ContactFormModal';
import { DeleteContactDialog } from '@/components/contacts/DeleteContactDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useContacts, Contact, useDeleteContact, useUpdateContact } from '@/hooks/useContacts';
import { EditableCell } from '@/components/ui/EditableCell';
import { Database } from '@/integrations/supabase/types';
import { Plus, Search, Users, Loader2, Upload, Pencil, Trash2 } from 'lucide-react';
import { ImportModal } from '@/components/import/ImportModal';
import { useCreateContact } from '@/hooks/useContacts';
import { useCreateInvestorDeal } from '@/hooks/useInvestorDeals';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ContactType = Database['public']['Enums']['contact_type'];

const TYPE_OPTIONS: { key: ContactType; label: string }[] = [
  { key: 'investor', label: 'Investor' },
  { key: 'owner', label: 'Owner' },
  { key: 'intermediary', label: 'Intermediary' },
  { key: 'advisor', label: 'Advisor' },
  { key: 'river_guide', label: 'River Guide' },
  { key: 'operator', label: 'Operator' },
  { key: 'other', label: 'Other' },
];

const warmthColors: Record<string, string> = {
  cold: 'bg-info',
  warm: 'bg-stage-warm',
  hot: 'bg-destructive',
};

export default function Contacts() {
  const { data: contacts = [], isLoading } = useContacts();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [warmthFilter, setWarmthFilter] = useState<string>('all');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const createContact = useCreateContact();
  const createInvestorDeal = useCreateInvestorDeal();
  const deleteContact = useDeleteContact();
  const updateContact = useUpdateContact();

  const handleInlineEdit = useCallback(async (id: string, field: string, value: string) => {
    try {
      const update: any = { id };
      update[field] = value || null;
      await updateContact.mutateAsync(update);
    } catch {
      toast.error('Failed to update');
    }
  }, [updateContact]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleImportContacts = async (records: any[]) => {
    for (const record of records) {
      const contactType = record.contact_type || 'investor';
      const createdContact = await createContact.mutateAsync({
        name: record.name || 'Unknown',
        email: record.email || null,
        phone: record.phone || null,
        organization: record.organization || null,
        role: record.role || null,
        geography: record.geography || null,
        source: record.source || 'import',
        contact_type: contactType,
        tags: record.tags || [],
        notes: record.notes || null,
      });

      // Auto-create investor_deals entry for investor-type contacts
      if (contactType === 'investor' && createdContact) {
        try {
          // Check if an investor deal already exists for this contact
          const { data: existing } = await supabase
            .from('investor_deals')
            .select('id')
            .eq('contact_id', createdContact.id)
            .maybeSingle();

          if (!existing) {
            await createInvestorDeal.mutateAsync({
              name: record.name || 'Unknown',
              organization: record.organization || null,
              contact_id: createdContact.id,
              stage: 'not_contacted',
              notes: record.notes || null,
            });
          }
        } catch (e) {
          console.error('Failed to create investor deal for contact:', e);
        }
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteContact.mutateAsync(id)));
      setSelectedIds(new Set());
      toast.success(`Deleted ${count} contacts`);
    } catch {
      toast.error('Failed to delete some contacts');
    }
  };

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesType = typeFilter === 'all' || c.contact_type === typeFilter;
      const matchesWarmth = warmthFilter === 'all' || c.warmth === warmthFilter;
      return matchesSearch && matchesType && matchesWarmth;
    });
  }, [contacts, searchQuery, typeFilter, warmthFilter]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
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
        title="Contacts"
        description="Manage your relationships"
        actions={
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete {selectedIds.size}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
              <Upload className="w-4 h-4 mr-1" /> Import
            </Button>
            <Button size="sm" onClick={() => { setSelectedContact(null); setIsFormOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Add Contact
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name, org, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TYPE_OPTIONS.map((t) => (
              <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={warmthFilter} onValueChange={setWarmthFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Warmth" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warmth</SelectItem>
            <SelectItem value="cold">Cold</SelectItem>
            <SelectItem value="warm">Warm</SelectItem>
            <SelectItem value="hot">Hot</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Geography</TableHead>
              <TableHead>Warmth</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12">
                  <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-medium">No contacts found</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Add your first contact to get started</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="group">
                  <TableCell>
                    <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <EditableCell
                        value={c.name}
                        onSave={(v) => handleInlineEdit(c.id, 'name', v)}
                        className="font-medium text-foreground"
                      />
                      {c.role && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{c.role}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={c.organization || ''}
                      onSave={(v) => handleInlineEdit(c.id, 'organization', v)}
                      className="text-muted-foreground"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize text-xs">
                      {c.contact_type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={c.email || ''}
                      onSave={(v) => handleInlineEdit(c.id, 'email', v)}
                      className="text-muted-foreground"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={c.phone || ''}
                      onSave={(v) => handleInlineEdit(c.id, 'phone', v)}
                      className="text-muted-foreground"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={c.geography || ''}
                      onSave={(v) => handleInlineEdit(c.id, 'geography', v)}
                      className="text-muted-foreground"
                    />
                  </TableCell>
                  <TableCell>
                    {c.warmth ? (
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${warmthColors[c.warmth] || ''}`} />
                        <span className="text-xs capitalize text-muted-foreground">{c.warmth}</span>
                      </div>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(c.tags || []).slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] px-1.5">{tag}</Badge>
                      ))}
                      {(c.tags || []).length > 2 && (
                        <Badge variant="outline" className="text-[10px] px-1.5">+{c.tags!.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedContact(c); setIsFormOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedContact(c); setIsDeleteOpen(true); }}>
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

      <p className="text-xs text-muted-foreground mt-2">{filtered.length} of {contacts.length} contacts</p>

      {/* Modals */}
      <ContactFormModal open={isFormOpen} onOpenChange={setIsFormOpen} contact={selectedContact} />
      <DeleteContactDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} contact={selectedContact} />
      <ImportModal open={isImportOpen} onOpenChange={setIsImportOpen} entityType="contacts" onImport={handleImportContacts} />
    </div>
  );
}
