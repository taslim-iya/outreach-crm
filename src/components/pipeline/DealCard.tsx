import { Company } from '@/hooks/useCompanies';
import { cn } from '@/lib/utils';
import { Building2, DollarSign, TrendingUp, MapPin, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface DealCardProps {
  company: Company;
  onEdit?: (company: Company) => void;
  onDelete?: (company: Company) => void;
}

const getScoreColor = (score: number | null) => {
  if (!score) return 'text-muted-foreground bg-muted';
  if (score >= 75) return 'text-success bg-success/10';
  if (score >= 50) return 'text-warning bg-warning/10';
  return 'text-muted-foreground bg-muted';
};

export function DealCard({ company, onEdit, onDelete }: DealCardProps) {
  const formatCurrency = (amount?: number | null) => {
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
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
              {company.name}
            </p>
            {company.industry && (
              <p className="text-xs text-muted-foreground truncate">{company.industry}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {company.attractiveness_score !== null && (
            <div
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                getScoreColor(company.attractiveness_score)
              )}
            >
              {company.attractiveness_score}
            </div>
          )}
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(company)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(company)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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

        {company.geography && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>{company.geography}</span>
          </div>
        )}
      </div>

      {company.notes && (
        <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{company.notes}</p>
      )}
    </div>
  );
}
