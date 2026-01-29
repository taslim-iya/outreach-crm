import { Mail, Phone, Calendar, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActivities } from '@/hooks/useActivities';
import { formatDistanceToNow } from 'date-fns';

const iconMap: Record<string, React.ElementType> = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  document: FileText,
  default: FileText,
};

const colorMap: Record<string, string> = {
  email: 'bg-info/10 text-info',
  call: 'bg-success/10 text-success',
  meeting: 'bg-primary/10 text-primary',
  document: 'bg-muted text-muted-foreground',
  default: 'bg-muted text-muted-foreground',
};

export function ActivityFeed() {
  const { data: activities = [], isLoading } = useActivities(5);

  const getTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-in shadow-card">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
        <button className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
          View all
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && activities.length === 0 && (
        <div className="text-center py-8">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
          <p className="text-xs text-muted-foreground mt-1">
            Activities will appear here as you interact with contacts and deals
          </p>
        </div>
      )}

      {!isLoading && activities.length > 0 && (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = iconMap[activity.activity_type] || iconMap.default;
            const color = colorMap[activity.activity_type] || colorMap.default;
            return (
              <div
                key={activity.id}
                className={cn(
                  'flex items-start gap-3 animate-slide-up',
                  index !== activities.length - 1 && 'pb-4 border-b border-border'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    color
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.description}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {getTimeAgo(activity.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
