import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ContactCard } from '@/components/contacts/ContactCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockContacts } from '@/data/mockData';
import { ContactType } from '@/types/crm';
import { Plus, Search, Filter, Users, Star, Building2, Briefcase, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs: { key: ContactType | 'all'; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All', icon: Users },
  { key: 'investor', label: 'Investors', icon: Star },
  { key: 'company_owner', label: 'Owners', icon: Building2 },
  { key: 'intermediary', label: 'Intermediaries', icon: Briefcase },
  { key: 'advisor', label: 'Advisors', icon: User },
];

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ContactType | 'all'>('all');

  const filteredContacts = mockContacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || contact.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Contacts"
        description="Manage your relationships"
        actions={
          <Button className="gradient-gold text-primary-foreground hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === tab.key
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className="ml-1 text-xs opacity-60">
              {tab.key === 'all'
                ? mockContacts.length
                : mockContacts.filter((c) => c.type === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
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

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredContacts.map((contact) => (
          <ContactCard key={contact.id} contact={contact} />
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No contacts found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}
