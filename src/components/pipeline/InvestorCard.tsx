import { useState } from 'react';
import { InvestorDeal, InvestorStage, useUpdateInvestorStage, useUpdateInvestorStageWithCommitment } from '@/hooks/useInvestorDeals';
import { cn } from '@/lib/utils';
import { DollarSign, MoreHorizontal, Pencil, Trash2, ArrowRight, Mail, Building2, User } from 'lucide-react';
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
import { SmartComposeModal } from '@/components/email/SmartComposeModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  const [composeOpen, setComposeOpen] = useState(false);
  const [pendingStage, setPendingStage] = useState<'committed' | 'closed' | null>(null);

  const { data: contactData } = useQuery({
    queryKey: ['investor_contact', deal.contact_id],
    queryFn: async () => {
      if (!deal.contact_id) return null;
      const { data } = await supabase
        .from('contacts')
        .select('email, name')
        .eq('id', deal.contact_id)
        .single();
      return data;
    },
    enabled: !!deal.contact_id,
  });

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
    if (newStage === 'committed' || newStage === 'closed') {
      setPendingStage(newStage);
      setCommitmentModalOpen(true);
      return;
    }
    
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
    <div className="goldman-card p-4 group cursor-pointer animate-slide-up">
      {/* Header row */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground shrink-0 shadow-xs">
            {getInitials(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate leading-tight">
              {displayName}
            </p>
            {showPersonalName && (
              <div className="flex items-center gap-1 mt-0.5">
                <User className="w-3 h-3 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground truncate">
                  {deal.name}
                </p>
              </div>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setComposeOpen(true)}>
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </DropdownMenuItem>
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

      {/* Commitment badge */}
      {commitmentDisplay && (
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-md mt-1">
          <DollarSign className="w-3.5 h-3.5" />
          <span>{commitmentDisplay}</span>
        </div>
      )}

      {/* Notes */}
      {deal.notes && (
        <p className="text-xs text-muted-foreground mt-2.5 line-clamp-2 leading-relaxed border-t border-border/50 pt-2.5">{deal.notes}</p>
      )}

      <CommitmentAmountModal
        open={commitmentModalOpen}
        onOpenChange={setCommitmentModalOpen}
        investor={deal}
        targetStage={pendingStage || 'committed'}
        onConfirm={handleCommitmentConfirm}
        isLoading={updateStageWithCommitment.isPending}
      />
      <SmartComposeModal
        open={composeOpen}
        onOpenChange={setComposeOpen}
        investorId={deal.id}
        investorName={deal.organization || deal.name}
        investorEmail={contactData?.email || ''}
      />
    </div>
  );
}
