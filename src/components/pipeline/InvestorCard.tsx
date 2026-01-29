import { InvestorDeal, InvestorStage, useUpdateInvestorStage } from '@/hooks/useInvestorDeals';
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

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleMoveToStage = async (newStage: InvestorStage) => {
    try {
      await updateStage.mutateAsync({ id: deal.id, stage: newStage });
      toast.success(`Moved to ${stageLabels[newStage]}`);
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
            {getInitials(deal.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
              {deal.name}
            </p>
            {deal.organization && (
              <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                {deal.organization}
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
    </div>
  );
}
