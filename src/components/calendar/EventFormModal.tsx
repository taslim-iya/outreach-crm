import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateCalendarEvent, useUpdateCalendarEvent, CalendarEvent } from '@/hooks/useCalendarEvents';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  defaultDate?: Date;
}

export function EventFormModal({ open, onOpenChange, event, defaultDate }: EventFormModalProps) {
  const { toast } = useToast();
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_date: format(new Date(), 'yyyy-MM-dd'),
    end_time: '10:00',
    all_day: false,
    location: '',
    meeting_type: '',
    meeting_link: '',
  });

  useEffect(() => {
    if (event) {
      const startDate = new Date(event.start_time);
      const endDate = new Date(event.end_time);
      setFormData({
        title: event.title,
        description: event.description || '',
        start_date: format(startDate, 'yyyy-MM-dd'),
        start_time: format(startDate, 'HH:mm'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        end_time: format(endDate, 'HH:mm'),
        all_day: event.all_day || false,
        location: event.location || '',
        meeting_type: event.meeting_type || '',
        meeting_link: event.meeting_link || '',
      });
    } else if (defaultDate) {
      setFormData(prev => ({
        ...prev,
        start_date: format(defaultDate, 'yyyy-MM-dd'),
        end_date: format(defaultDate, 'yyyy-MM-dd'),
      }));
    } else {
      setFormData({
        title: '',
        description: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_date: format(new Date(), 'yyyy-MM-dd'),
        end_time: '10:00',
        all_day: false,
        location: '',
        meeting_type: '',
        meeting_link: '',
      });
    }
  }, [event, defaultDate, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    const startDateTime = formData.all_day
      ? `${formData.start_date}T00:00:00`
      : `${formData.start_date}T${formData.start_time}:00`;
    const endDateTime = formData.all_day
      ? `${formData.end_date}T23:59:59`
      : `${formData.end_date}T${formData.end_time}:00`;

    const eventData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      start_time: startDateTime,
      end_time: endDateTime,
      all_day: formData.all_day,
      location: formData.location.trim() || null,
      meeting_type: formData.meeting_type || null,
      meeting_link: formData.meeting_link.trim() || null,
    };

    try {
      if (event) {
        await updateEvent.mutateAsync({ id: event.id, ...eventData });
        toast({ title: 'Success', description: 'Event updated successfully' });
      } else {
        await createEvent.mutateAsync(eventData);
        toast({ title: 'Success', description: 'Event created successfully' });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save event',
        variant: 'destructive',
      });
    }
  };

  const isLoading = createEvent.isPending || updateEvent.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'New Event'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Meeting with..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="all_day"
              checked={formData.all_day}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, all_day: checked }))}
            />
            <Label htmlFor="all_day">All day event</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            {!formData.all_day && (
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
            {!formData.all_day && (
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting_type">Meeting Type</Label>
            <Select
              value={formData.meeting_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, meeting_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video Call</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
                <SelectItem value="google_meet">Google Meet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Office, Zoom, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting_link">Meeting Link</Label>
            <Input
              id="meeting_link"
              value={formData.meeting_link}
              onChange={(e) => setFormData(prev => ({ ...prev, meeting_link: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {event ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
