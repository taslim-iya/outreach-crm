import { useState } from 'react';
import { useAIConfigured, useAICall, useAISettings, useLogAIAction } from '@/hooks/useAI';
import { useCreateCalendarEvent } from '@/hooks/useCalendarEvents';
import { useCreateTask } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Loader2, Clock, Check, Video } from 'lucide-react';
import { toast } from 'sonner';

interface MeetingSlot {
  date: string;
  startTime: string;
  endTime: string;
  display: string;
}

interface MeetingDetection {
  hasMeetingIntent: boolean;
  confidence: number;
  suggestedSlots: MeetingSlot[];
  suggestedSubject: string;
  meetingType: string;
}

interface AIMeetingSchedulerProps {
  emailBody: string;
  contactName: string;
  contactEmail?: string;
  contactId?: string;
  onMeetingScheduled?: () => void;
}

export function AIMeetingScheduler({ emailBody, contactName, contactEmail, contactId, onMeetingScheduled }: AIMeetingSchedulerProps) {
  const { isConfigured } = useAIConfigured();
  const { data: settings } = useAISettings();
  const aiCall = useAICall();
  const logAction = useLogAIAction();
  const createEvent = useCreateCalendarEvent();
  const createTask = useCreateTask();
  const [detection, setDetection] = useState<MeetingDetection | null>(null);
  const [scheduling, setScheduling] = useState(false);

  const handleDetect = async () => {
    const workingHours = settings ? `${settings.working_hours_start}:00 to ${settings.working_hours_end}:00` : '9:00 to 17:00';
    const workingDays = settings?.working_days?.join(', ') || 'mon, tue, wed, thu, fri';
    const tz = settings?.timezone || 'America/New_York';

    const today = new Date();
    const nextWeekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i + 1);
      return d.toISOString().split('T')[0];
    });

    try {
      const result = await aiCall.mutateAsync({
        systemPrompt: `You detect meeting intent in emails and suggest time slots. Respond with ONLY JSON (no markdown): {"hasMeetingIntent": true/false, "confidence": 0.0-1.0, "suggestedSlots": [{"date": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM", "display": "human readable"}], "suggestedSubject": "meeting subject", "meetingType": "call|video|in_person"}`,
        messages: [{ role: 'user', content: `Email from ${contactName}: "${emailBody}"\n\nWorking hours: ${workingHours}\nWorking days: ${workingDays}\nTimezone: ${tz}\nAvailable dates: ${nextWeekDates.join(', ')}\n\nSuggest 3 optimal time slots if meeting intent detected.` }],
        maxTokens: 512,
        temperature: 0.3,
      });
      const parsed = JSON.parse(result.content) as MeetingDetection;
      setDetection(parsed);

      if (parsed.hasMeetingIntent) {
        logAction.mutate({
          actionType: 'meeting_detected',
          entityType: 'contact',
          entityId: contactId,
          suggestion: `${contactName} wants to meet: ${parsed.suggestedSubject}`,
          status: 'pending',
        });
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleSchedule = async (slot: MeetingSlot) => {
    setScheduling(true);
    try {
      const startTime = new Date(`${slot.date}T${slot.startTime}:00`);
      const endTime = new Date(`${slot.date}T${slot.endTime}:00`);

      createEvent.mutate({
        title: detection?.suggestedSubject || `Meeting with ${contactName}`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        meeting_type: detection?.meetingType || 'video',
        contact_id: contactId || null,
      }, {
        onSuccess: () => {
          createTask.mutate({
            title: `Follow up after meeting with ${contactName}`,
            priority: 'high',
          });
          toast.success(`Meeting scheduled: ${slot.display}`);
          onMeetingScheduled?.();
          logAction.mutate({
            actionType: 'meeting_scheduled',
            entityType: 'contact',
            entityId: contactId,
            suggestion: `Meeting scheduled for ${slot.display}`,
            status: 'accepted',
          });
        },
      });
    } finally {
      setScheduling(false);
    }
  };

  if (!isConfigured) return null;

  if (!detection) {
    return (
      <Button size="sm" variant="outline" className="text-xs" onClick={handleDetect} disabled={aiCall.isPending}>
        {aiCall.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Calendar className="h-3 w-3 mr-1" />}
        Detect Meeting Intent
      </Button>
    );
  }

  if (!detection.hasMeetingIntent) {
    return <span className="text-xs text-muted-foreground">No meeting intent detected</span>;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{contactName} wants to meet!</span>
          <Badge variant="outline" className="text-xs">{Math.round(detection.confidence * 100)}% confident</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{detection.suggestedSubject}</p>
        <div className="space-y-1.5">
          <p className="text-xs font-medium">Suggested times:</p>
          {detection.suggestedSlots.map((slot, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded border bg-background">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">{slot.display}</span>
              </div>
              <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => handleSchedule(slot)} disabled={scheduling}>
                {scheduling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                Schedule
              </Button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Video className="h-3 w-3" /> Type: {detection.meetingType}
        </div>
      </CardContent>
    </Card>
  );
}
