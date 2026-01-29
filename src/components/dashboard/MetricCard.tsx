import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  className,
}: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-glow animate-fade-in',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-semibold text-foreground tracking-tight">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              {isPositive && <TrendingUp className="w-3.5 h-3.5 text-success" />}
              {isNegative && <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
              <span
                className={cn(
                  'text-xs font-medium',
                  isPositive && 'text-success',
                  isNegative && 'text-destructive',
                  !isPositive && !isNegative && 'text-muted-foreground'
                )}
              >
                {isPositive && '+'}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}
