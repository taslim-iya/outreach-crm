import { Company } from '@/types/crm';
import { cn } from '@/lib/utils';
import { Building2, DollarSign, TrendingUp, MapPin } from 'lucide-react';

interface DealCardProps {
  company: Company;
}

const getScoreColor = (score: number) => {
  if (score >= 75) return 'text-success bg-success/10';
  if (score >= 50) return 'text-warning bg-warning/10';
  return 'text-muted-foreground bg-muted';
};

export function DealCard({ company }: DealCardProps) {
  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 hover:border-primary/30 transition-all duration-200 cursor-pointer group hover:shadow-glow animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {company.name}
            </p>
            <p className="text-xs text-muted-foreground">{company.industry}</p>
          </div>
        </div>
        <div
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            getScoreColor(company.attractivenessScore)
          )}
        >
          {company.attractivenessScore}
        </div>
      </div>

      <div className="space-y-2">
        {company.revenue && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Revenue
            </span>
            <span className="text-foreground font-medium">{formatCurrency(company.revenue)}</span>
          </div>
        )}

        {company.ebitda && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              EBITDA
            </span>
            <span className="text-foreground font-medium">{formatCurrency(company.ebitda)}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span>{company.geography}</span>
        </div>
      </div>

      {company.notes && (
        <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{company.notes}</p>
      )}
    </div>
  );
}
