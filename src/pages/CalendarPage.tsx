import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Video, Phone, MapPin, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const upcomingMeetings = [
  {
    id: '1',
    title: 'Investor Call - Sarah Chen',
    date: 'Today',
    time: '2:00 PM',
    type: 'video',
    company: 'Redpoint Ventures',
  },
  {
    id: '2',
    title: 'Owner Intro - David Kim',
    date: 'Tomorrow',
    time: '10:00 AM',
    type: 'phone',
    company: 'Precision Manufacturing',
  },
  {
    id: '3',
    title: 'Due Diligence Review',
    date: 'Jan 25',
    time: '3:30 PM',
    type: 'video',
    company: 'HomeHealth Services',
  },
  {
    id: '4',
    title: 'Advisor Check-in',
    date: 'Jan 26',
    time: '11:00 AM',
    type: 'phone',
    company: 'HBS Search Fund Club',
  },
];

const tasks = [
  { id: '1', title: 'Send follow-up to Michael Roberts', dueDate: 'Today', priority: 'high' },
  { id: '2', title: 'Review Precision Mfg financials', dueDate: 'Tomorrow', priority: 'medium' },
  { id: '3', title: 'Prepare investor deck updates', dueDate: 'This week', priority: 'low' },
];

const typeIcons = {
  video: Video,
  phone: Phone,
  in_person: MapPin,
};

const priorityColors = {
  high: 'border-l-destructive',
  medium: 'border-l-warning',
  low: 'border-l-muted-foreground',
};

export default function CalendarPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Calendar"
        description="Manage your meetings and tasks"
        actions={
          <Button className="gradient-gold text-primary-foreground hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              January 2024
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="py-2 text-muted-foreground text-xs font-medium">
                  {day}
                </div>
              ))}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <div
                  key={day}
                  className={cn(
                    'py-2 rounded-lg cursor-pointer hover:bg-muted transition-colors text-sm',
                    day === 23 && 'bg-primary text-primary-foreground hover:bg-primary',
                    [24, 25, 26].includes(day) && 'bg-primary/10 text-primary'
                  )}
                >
                  {day}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingMeetings.map((meeting) => {
              const Icon = typeIcons[meeting.type as keyof typeof typeIcons] || Video;
              return (
                <div
                  key={meeting.id}
                  className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium">{meeting.title}</p>
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{meeting.company}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{meeting.date} at {meeting.time}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Tasks */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Pending Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'p-3 rounded-lg border border-border border-l-4 hover:bg-muted/50 transition-colors cursor-pointer',
                  priorityColors[task.priority as keyof typeof priorityColors]
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{task.title}</p>
                  <span className="text-xs text-muted-foreground">{task.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
