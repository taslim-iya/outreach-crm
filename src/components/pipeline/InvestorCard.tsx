import { InvestorDeal, Contact } from '@/types/crm';
import { cn } from '@/lib/utils';
import { Mail, Calendar, DollarSign } from 'lucide-react';

interface InvestorCardProps {
  deal: InvestorDeal;
  contact: Contact;
}

const warmthColors = {
  cold: 'bg-stage-cold',
  warm: 'bg-stage-warm',
  hot: 'bg-stage-hot',
};

export function InvestorCard({ deal, contact }: InvestorCardProps) {
  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 hover:border-primary/30 transition-all duration-200 cursor-pointer group hover:shadow-glow animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground">
            {contact.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {contact.name}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
              {contact.organization}
            </p>
          </div>
        </div>
        <div className={cn('w-2 h-2 rounded-full', warmthColors[contact.warmth])} />
      </div>

      <div className="space-y-2">
        {deal.targetAmount && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Target: {formatCurrency(deal.targetAmount)}</span>
          </div>
        )}

        {deal.activities.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="w-3.5 h-3.5" />
            <span>{deal.activities.length} interactions</span>
          </div>
        )}

        {contact.lastInteraction && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Last: {new Date(contact.lastInteraction).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {contact.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {contact.tags.length > 2 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              +{contact.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
