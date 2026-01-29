import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { KanbanColumn } from '@/components/pipeline/KanbanColumn';
import { InvestorCard } from '@/components/pipeline/InvestorCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockInvestorDeals, mockContacts } from '@/data/mockData';
import { InvestorStage } from '@/types/crm';
import { Plus, Search, Filter } from 'lucide-react';

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

export default function Investors() {
  const [searchQuery, setSearchQuery] = useState('');

  const getDealsForStage = (stage: InvestorStage) => {
    return mockInvestorDeals.filter((deal) => deal.stage === stage);
  };

  const getContactForDeal = (contactId: string) => {
    return mockContacts.find((c) => c.id === contactId);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 pb-4">
        <PageHeader
          title="Investor Pipeline"
          description="Track your fundraising progress"
          actions={
            <Button className="gradient-gold text-primary-foreground hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Add Investor
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search investors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto px-6 pb-6">
        <div className="flex gap-4 h-full min-w-max">
          {stages.map((stage) => {
            const deals = getDealsForStage(stage.key);
            return (
              <KanbanColumn
                key={stage.key}
                title={stage.label}
                count={deals.length}
                color={stage.color}
              >
                {deals.map((deal) => {
                  const contact = getContactForDeal(deal.contactId);
                  if (!contact) return null;
                  return (
                    <InvestorCard key={deal.id} deal={deal} contact={contact} />
                  );
                })}
              </KanbanColumn>
            );
          })}
        </div>
      </div>
    </div>
  );
}
