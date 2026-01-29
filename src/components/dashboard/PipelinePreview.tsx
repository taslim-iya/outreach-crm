import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StageData {
  name: string;
  count: number;
  color: string;
}

interface PipelinePreviewProps {
  title: string;
  stages: StageData[];
  href: string;
  total: number;
}

export function PipelinePreview({ title, stages, href, total }: PipelinePreviewProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-in shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <Link
          to={href}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted flex overflow-hidden mb-4">
        {stages.map((stage, index) => (
          <div
            key={stage.name}
            className={cn('h-full transition-all duration-500', stage.color)}
            style={{ width: `${(stage.count / total) * 100}%` }}
          />
        ))}
      </div>

      {/* Stage breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {stages.slice(0, 4).map((stage) => (
          <div key={stage.name} className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', stage.color)} />
            <span className="text-xs text-muted-foreground truncate">{stage.name}</span>
            <span className="text-xs font-medium text-foreground ml-auto">{stage.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
