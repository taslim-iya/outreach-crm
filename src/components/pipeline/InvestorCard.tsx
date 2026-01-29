import { useState } from 'react';
import { InvestorDeal, InvestorStage, useUpdateInvestorStage, useUpdateInvestorStageWithCommitment } from '@/hooks/useInvestorDeals';
import { cn } from '@/lib/utils';
import { DollarSign, MoreHorizontal, Pencil, Trash2, ArrowRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CommitmentAmountModal } from './CommitmentAmountModal';

interface InvestorCardProps {
  deal: InvestorDeal;
  onEdit?: () => void;
  onDelete?: () => void;
}

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

const stageOrder: InvestorStage[] = [
  'not_contacted',
  'outreach_sent',
  'follow_up',
  'meeting_scheduled',
  'interested',
  'committed',
  'closed',
  'passed',
];

export function InvestorCard({ deal, onEdit, onDelete }: InvestorCardProps) {
  const updateStage = useUpdateInvestorStage();
  const updateStageWithCommitment = useUpdateInvestorStageWithCommitment();
  
  const [commitmentModalOpen, setCommitmentModalOpen] = useState(false);
  const [pendingStage, setPendingStage] = useState<'committed' | 'closed' | null>(null);

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Display name: prefer organization over personal name
  const displayName = deal.organization || deal.name;
  const showPersonalName = deal.organization && deal.name;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleMoveToStage = async (newStage: InvestorStage) => {
    // For committed or closed stages, show the commitment amount modal
    if (newStage === 'committed' || newStage === 'closed') {
      setPendingStage(newStage);
      setCommitmentModalOpen(true);
      return;
    }
    
    // For other stages, update directly
    try {
      await updateStage.mutateAsync({ id: deal.id, stage: newStage });
      toast.success(`Moved to ${stageLabels[newStage]}`);
    } catch (error) {
      toast.error('Failed to update stage');
    }
  };

  const handleCommitmentConfirm = async (amount: number) => {
    if (!pendingStage) return;
    
    try {
      await updateStageWithCommitment.mutateAsync({
        id: deal.id,
        stage: pendingStage,
        commitment_amount: amount,
      });
      toast.success(`Moved to ${stageLabels[pendingStage]} with ${formatCurrency(amount)} commitment`);
      setCommitmentModalOpen(false);
      setPendingStage(null);
    } catch (error) {
      toast.error('Failed to update stage');
    }
  };

  const commitmentDisplay = formatCurrency(deal.commitment_amount);

  return (
    <div className="bg-card rounded-lg border border-border p-4 hover:shadow-card-hover transition-all duration-200 cursor-pointer group shadow-card animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground">
            {getInitials(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
              {displayName}
            </p>
            {showPersonalName && (
              <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                {deal.name}
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowRight className="w-4 h-4 mr-2" />
                Move to Stage
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {stageOrder.map((stage) => (
                  <DropdownMenuItem
                    key={stage}
                    disabled={stage === deal.stage}
                    onClick={() => handleMoveToStage(stage)}
                  >
                    {stageLabels[stage]}
                    {stage === deal.stage && ' (current)'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {commitmentDisplay && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <DollarSign className="w-3.5 h-3.5" />
          <span>{commitmentDisplay}</span>
        </div>
      )}

      {deal.notes && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{deal.notes}</p>
      )}

      <CommitmentAmountModal
        open={commitmentModalOpen}
        onOpenChange={setCommitmentModalOpen}
        investor={deal}
        targetStage={pendingStage || 'committed'}
        onConfirm={handleCommitmentConfirm}
        isLoading={updateStageWithCommitment.isPending}
      />
    </div>
  );
}
