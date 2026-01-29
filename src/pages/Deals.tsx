import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { KanbanColumn } from '@/components/pipeline/KanbanColumn';
import { DealCard } from '@/components/pipeline/DealCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockCompanies } from '@/data/mockData';
import { DealStage } from '@/types/crm';
import { Plus, Search, Filter } from 'lucide-react';

const stages: { key: DealStage; label: string; color: string }[] = [
  { key: 'identified', label: 'Identified', color: 'bg-stage-cold' },
  { key: 'researching', label: 'Researching', color: 'bg-stage-cold' },
  { key: 'outreach_sent', label: 'Outreach Sent', color: 'bg-info' },
  { key: 'follow_up', label: 'Follow-up', color: 'bg-info' },
  { key: 'nda_sent', label: 'NDA Sent', color: 'bg-stage-warm' },
  { key: 'nda_signed', label: 'NDA Signed', color: 'bg-stage-warm' },
  { key: 'in_discussion', label: 'In Discussion', color: 'bg-primary' },
  { key: 'due_diligence', label: 'Due Diligence', color: 'bg-success' },
  { key: 'loi', label: 'LOI', color: 'bg-success' },
  { key: 'passed', label: 'Passed', color: 'bg-stage-passed' },
  { key: 'closed', label: 'Closed', color: 'bg-success' },
];

export default function Deals() {
  const [searchQuery, setSearchQuery] = useState('');

  const getCompaniesForStage = (stage: DealStage) => {
    return mockCompanies.filter((company) => company.stage === stage);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 pb-4">
        <PageHeader
          title="Deal Pipeline"
          description="Track your acquisition targets"
          actions={
            <Button className="gradient-gold text-primary-foreground hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
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
            const companies = getCompaniesForStage(stage.key);
            return (
              <KanbanColumn
                key={stage.key}
                title={stage.label}
                count={companies.length}
                color={stage.color}
              >
                {companies.map((company) => (
                  <DealCard key={company.id} company={company} />
                ))}
              </KanbanColumn>
            );
          })}
        </div>
      </div>
    </div>
  );
}
