import { useState } from 'react';
import { KanbanColumn } from '@/components/pipeline/KanbanColumn';
import { InvestorCard } from '@/components/pipeline/InvestorCard';
import { InvestorFormModal } from '@/components/pipeline/InvestorFormModal';
import { DeleteInvestorDialog } from '@/components/pipeline/DeleteInvestorDialog';
import { CommitmentAmountModal } from '@/components/pipeline/CommitmentAmountModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInvestorDeals, InvestorDeal, InvestorStage, useUpdateInvestorStage, useUpdateInvestorStageWithCommitment } from '@/hooks/useInvestorDeals';
import { Plus, Search, Filter, Loader2, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DragDropContext, Draggable, type DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';

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

export default function Investors() {
  const { user } = useAuth();
  const { data: investors = [], isLoading } = useInvestorDeals();
  const [searchQuery, setSearchQuery] = useState('');
  const updateStage = useUpdateInvestorStage();
  const updateStageWithCommitment = useUpdateInvestorStageWithCommitment();

  // Commitment modal state for drag-to-committed/closed
  const [commitmentModalOpen, setCommitmentModalOpen] = useState(false);
  const [pendingDragDeal, setPendingDragDeal] = useState<InvestorDeal | null>(null);
  const [pendingDragStage, setPendingDragStage] = useState<'committed' | 'closed' | null>(null);

  // Fetch company name from profile
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

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<InvestorDeal | null>(null);
  const [defaultStage, setDefaultStage] = useState<InvestorStage>('not_contacted');

  const filteredInvestors = investors.filter((investor) => {
    const matchesSearch =
      investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (investor.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const getDealsForStage = (stage: InvestorStage) => {
    return filteredInvestors.filter((investor) => investor.stage === stage);
  };

  const handleAddInvestor = (stage?: InvestorStage) => {
    setSelectedInvestor(null);
    setDefaultStage(stage || 'not_contacted');
    setIsFormOpen(true);
  };

  const handleEditInvestor = (investor: InvestorDeal) => {
    setSelectedInvestor(investor);
    setIsFormOpen(true);
  };

  const handleDeleteInvestor = (investor: InvestorDeal) => {
    setSelectedInvestor(investor);
    setIsDeleteOpen(true);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination, source } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const newStage = destination.droppableId as InvestorStage;
    const deal = investors.find((d) => d.id === draggableId);
    if (!deal) return;

    // For committed/closed, prompt for commitment amount
    if (newStage === 'committed' || newStage === 'closed') {
      setPendingDragDeal(deal);
      setPendingDragStage(newStage);
      setCommitmentModalOpen(true);
      return;
    }

    try {
      await updateStage.mutateAsync({ id: deal.id, stage: newStage });
      toast.success(`Moved to ${stageLabels[newStage]}`);
    } catch {
      toast.error('Failed to update stage');
    }
  };

  const handleDragCommitmentConfirm = async (amount: number) => {
    if (!pendingDragDeal || !pendingDragStage) return;
    try {
      await updateStageWithCommitment.mutateAsync({
        id: pendingDragDeal.id,
        stage: pendingDragStage,
        commitment_amount: amount,
      });
      toast.success(`Moved to ${stageLabels[pendingDragStage]}`);
      setCommitmentModalOpen(false);
      setPendingDragDeal(null);
      setPendingDragStage(null);
    } catch {
      toast.error('Failed to update stage');
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col bg-background">
      <div className="p-4 md:p-6 pb-4">
        {/* Premium Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
                  {companyName ? `${companyName} Investor Pipeline` : 'Investor Pipeline'}
                </h1>
                <p className="text-sm text-muted-foreground">Track your fundraising progress</p>
              </div>
            </div>
          </div>
          <Button onClick={() => handleAddInvestor()} className="gradient-primary shadow-md hover:shadow-lg transition-shadow">
            <Plus className="w-4 h-4 mr-2" />
            Add Investor
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search investors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border shadow-xs focus:shadow-sm transition-shadow"
            />
          </div>
          <Button variant="outline" size="icon" className="shadow-xs">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && investors.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No investors yet</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            Start building your investor pipeline by adding your first investor.
          </p>
          <Button onClick={() => handleAddInvestor()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Investor
          </Button>
        </div>
      )}

      {/* Kanban Board with Drag & Drop */}
      {!isLoading && investors.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
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
                    droppableId={stage.key}
                  >
                    {deals.map((deal, index) => (
                      <Draggable key={deal.id} draggableId={deal.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'opacity-90 rotate-1 scale-[1.02]' : ''}
                            style={provided.draggableProps.style}
                          >
                            <InvestorCard
                              deal={deal}
                              onEdit={() => handleEditInvestor(deal)}
                              onDelete={() => handleDeleteInvestor(deal)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </KanbanColumn>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}

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
      {/* Commitment modal for drag-to-committed/closed */}
      <CommitmentAmountModal
        open={commitmentModalOpen}
        onOpenChange={(open) => {
          setCommitmentModalOpen(open);
          if (!open) {
            setPendingDragDeal(null);
            setPendingDragStage(null);
          }
        }}
        investor={pendingDragDeal}
        targetStage={pendingDragStage || 'committed'}
        onConfirm={handleDragCommitmentConfirm}
        isLoading={updateStageWithCommitment.isPending}
      />
    </div>
  );
}
