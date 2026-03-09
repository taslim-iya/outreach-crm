import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, parseISO } from 'date-fns';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Video, Phone, MapPin, Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCalendarEvents, useUpcomingEvents } from '@/hooks/useCalendarEvents';
import { useTasks } from '@/hooks/useTasks';
import { EventFormModal } from '@/components/calendar/EventFormModal';

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add padding for days before the first of the month
  const startPadding = monthStart.getDay();
  
  const { data: events = [], isLoading: eventsLoading } = useCalendarEvents(monthStart, monthEnd);
  const { data: upcomingEvents = [], isLoading: upcomingLoading } = useUpcomingEvents(5);
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  
  const pendingTasks = tasks.filter(t => !t.completed).slice(0, 5);
  
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.start_time);
      return isSameDay(eventDate, date);
    });
  };

  const formatEventTime = (dateString: string) => {
    return format(parseISO(dateString), 'h:mm a');
  };

  const formatEventDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (isSameDay(date, tomorrow)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Calendar"
        description="Manage your meetings and schedule"
        actions={
          <Button 
            className="gradient-primary text-primary-foreground hover:opacity-90"
            onClick={() => setIsEventModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 goldman-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2 font-semibold">
              <Calendar className="w-4 h-4 text-primary" />
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="text-xs"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="py-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  {day}
                </div>
              ))}
              
              {/* Empty cells for padding */}
              {Array.from({ length: startPadding }).map((_, i) => (
                <div key={`pad-${i}`} className="py-2" />
              ))}
              
              {daysInMonth.map((day) => {
                const dayEvents = getEventsForDate(day);
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'py-2 rounded-lg cursor-pointer transition-all text-sm relative',
                      'hover:bg-muted',
                      isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                      isTodayDate && !isSelected && 'ring-1 ring-primary text-primary font-semibold',
                      dayEvents.length > 0 && !isSelected && 'bg-primary/10'
                    )}
                  >
                    {format(day, 'd')}
                    {dayEvents.length > 0 && (
                      <span className={cn(
                        'absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                        isSelected ? 'bg-primary-foreground' : 'bg-primary'
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card className="goldman-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming meetings</p>
              </div>
            ) : (
              upcomingEvents.map((event) => {
                const Icon = typeIcons[event.meeting_type as keyof typeof typeIcons] || Video;
                return (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer bg-card"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium leading-tight">{event.title}</p>
                      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    {event.location && (
                      <p className="text-xs text-muted-foreground mb-1">{event.location}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatEventDate(event.start_time)} at {formatEventTime(event.start_time)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tasks */}
      <Card className="mt-6 goldman-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Pending Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : pendingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No pending tasks</p>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    'p-3 rounded-lg border border-border border-l-4 hover:bg-muted/50 transition-colors cursor-pointer',
                    priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{task.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {task.due_date ? format(parseISO(task.due_date), 'MMM d') : 'No due date'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EventFormModal
        open={isEventModalOpen}
        onOpenChange={setIsEventModalOpen}
        defaultDate={selectedDate}
      />
    </div>
  );
}
