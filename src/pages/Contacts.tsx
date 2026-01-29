import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ContactCard } from '@/components/contacts/ContactCard';
import { ContactFormModal } from '@/components/contacts/ContactFormModal';
import { DeleteContactDialog } from '@/components/contacts/DeleteContactDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContacts, Contact } from '@/hooks/useContacts';
import { Database } from '@/integrations/supabase/types';
import { Plus, Search, Filter, Users, Star, Building2, Briefcase, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ContactType = Database['public']['Enums']['contact_type'];

const tabs: { key: ContactType | 'all'; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All', icon: Users },
  { key: 'investor', label: 'Investors', icon: Star },
  { key: 'owner', label: 'Owners', icon: Building2 },
  { key: 'intermediary', label: 'Intermediaries', icon: Briefcase },
  { key: 'advisor', label: 'Advisors', icon: User },
];

export default function Contacts() {
  const { data: contacts = [], isLoading } = useContacts();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ContactType | 'all'>('all');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesTab = activeTab === 'all' || contact.contact_type === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleAddContact = () => {
    setSelectedContact(null);
    setIsFormOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsFormOpen(true);
  };

  const handleDeleteContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDeleteOpen(true);
  };

  const getTabCount = (tabKey: ContactType | 'all') => {
    if (tabKey === 'all') return contacts.length;
    return contacts.filter((c) => c.contact_type === tabKey).length;
  };

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Contacts"
        description="Manage your relationships"
        actions={
          <Button onClick={handleAddContact}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        }
      />

      {/* Tabs - scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-6 border-b border-border pb-4">
        <div className="flex items-center gap-2 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
              <span className="ml-1 text-xs opacity-60">{getTabCount(tab.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Contacts Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={() => handleEditContact(contact)}
              onDelete={() => handleDeleteContact(contact)}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {contacts.length === 0 ? 'No contacts yet' : 'No contacts found'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {contacts.length === 0
              ? 'Add your first contact to get started.'
              : 'Try adjusting your search or filters'}
          </p>
          {contacts.length === 0 && (
            <Button onClick={handleAddContact}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Contact
            </Button>
          )}
        </div>
      )}

      {/* Modals */}
      <ContactFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        contact={selectedContact}
      />
      <DeleteContactDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        contact={selectedContact}
      />
    </div>
  );
}
