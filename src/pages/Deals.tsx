import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { KanbanColumn } from '@/components/pipeline/KanbanColumn';
import { DealCard } from '@/components/pipeline/DealCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCompanies, useCreateCompany, Company, DealStage } from '@/hooks/useCompanies';
import { CompanyFormModal } from '@/components/deals/CompanyFormModal';
import { DeleteCompanyDialog } from '@/components/deals/DeleteCompanyDialog';
import { ImportModal } from '@/components/import/ImportModal';
import { Plus, Search, Filter, Loader2, Upload } from 'lucide-react';

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
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const { data: companies, isLoading, error } = useCompanies();
  const createCompany = useCreateCompany();

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

  const getCompaniesForStage = (stage: DealStage) => {
    if (!companies) return [];
    return companies
      .filter((company) => company.stage === stage)
      .filter((company) =>
        searchQuery
          ? company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            company.geography?.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      );
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsFormModalOpen(true);
  };

  const handleDeleteCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsDeleteDialogOpen(true);
  };

  const handleAddCompany = () => {
    setSelectedCompany(null);
    setIsFormModalOpen(true);
  };

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <p className="text-destructive">Failed to load companies</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 pb-4">
        <PageHeader
          title="Deal Pipeline"
          description="Track your acquisition targets"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button 
                className="gradient-gold text-primary-foreground hover:opacity-90"
                onClick={handleAddCompany}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
            </div>
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
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex gap-4 h-full min-w-max">
            {stages.map((stage) => {
              const stageCompanies = getCompaniesForStage(stage.key);
              return (
                <KanbanColumn
                  key={stage.key}
                  title={stage.label}
                  count={stageCompanies.length}
                  color={stage.color}
                >
                  {stageCompanies.map((company) => (
                    <DealCard 
                      key={company.id} 
                      company={company}
                      onEdit={handleEditCompany}
                      onDelete={handleDeleteCompany}
                    />
                  ))}
                </KanbanColumn>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CompanyFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        company={selectedCompany}
      />
      <DeleteCompanyDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        company={selectedCompany}
      />
      <ImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        entityType="companies"
        onImport={handleImportCompanies}
      />
    </div>
  );
}
