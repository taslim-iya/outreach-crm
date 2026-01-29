import { Mail, Phone, Calendar, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'document';
  title: string;
  description: string;
  time: string;
  contact?: string;
}

const activities: ActivityItem[] = [
  {
    id: '1',
    type: 'meeting',
    title: 'Meeting with Sarah Chen',
    description: 'Investor pitch - Redpoint Ventures',
    time: '2 hours ago',
    contact: 'Sarah Chen',
  },
  {
    id: '2',
    type: 'email',
    title: 'NDA sent to David Kim',
    description: 'Precision Manufacturing Co',
    time: '4 hours ago',
    contact: 'David Kim',
  },
  {
    id: '3',
    type: 'document',
    title: 'CIM received',
    description: 'HomeHealth Services LLC',
    time: '1 day ago',
  },
  {
    id: '4',
    type: 'call',
    title: 'Call with Jennifer Walsh',
    description: 'New deal introduction',
    time: '1 day ago',
    contact: 'Jennifer Walsh',
  },
];

const iconMap = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  document: FileText,
};

const colorMap = {
  email: 'bg-info/10 text-info',
  call: 'bg-success/10 text-success',
  meeting: 'bg-primary/10 text-primary',
  document: 'bg-muted text-muted-foreground',
};

export function ActivityFeed() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-in shadow-card">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
        <button className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
          View all
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
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
                  colorMap[activity.type]
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.description}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{activity.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
