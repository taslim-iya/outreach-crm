import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SendTimeSlot {
  day_of_week: number;
  hour_of_day: number;
  score: number;
  open_count: number;
  reply_count: number;
}

// Get best send times for a specific contact or globally
export function useBestSendTimes(contactId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['smart-send-times', user?.id, contactId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('smart_send_times')
        .select('*')
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(10);

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SendTimeSlot[];
    },
    enabled: !!user,
  });
}

// Record an engagement event to build send time intelligence
export function useRecordSendTimeEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ contactId, eventType, timestamp }: { contactId?: string; eventType: 'open' | 'reply'; timestamp?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const date = timestamp ? new Date(timestamp) : new Date();
      const dayOfWeek = date.getDay();
      const hourOfDay = date.getHours();

      // Try to update existing record
      const { data: existing } = await supabase
        .from('smart_send_times')
        .select('*')
        .eq('user_id', user.id)
        .eq('day_of_week', dayOfWeek)
        .eq('hour_of_day', hourOfDay)
        .is('contact_id', contactId || null)
        .maybeSingle();

      if (existing) {
        const updates: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (eventType === 'open') {
          updates.open_count = (existing.open_count || 0) + 1;
        } else {
          updates.reply_count = (existing.reply_count || 0) + 1;
        }
        updates.score = ((updates.open_count as number || existing.open_count || 0) * 1) +
                        ((updates.reply_count as number || existing.reply_count || 0) * 3);

        const { error } = await supabase
          .from('smart_send_times')
          .update(updates)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const openCount = eventType === 'open' ? 1 : 0;
        const replyCount = eventType === 'reply' ? 1 : 0;
        const { error } = await supabase
          .from('smart_send_times')
          .insert({
            user_id: user.id,
            contact_id: contactId || null,
            day_of_week: dayOfWeek,
            hour_of_day: hourOfDay,
            open_count: openCount,
            reply_count: replyCount,
            score: openCount * 1 + replyCount * 3,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-send-times'] });
    },
  });
}

// Get optimal send time recommendation
export function useOptimalSendTime(contactId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['optimal-send-time', user?.id, contactId],
    queryFn: async () => {
      if (!user) return { day: 2, hour: 10, confidence: 'low' }; // Default: Tuesday 10am

      let query = supabase
        .from('smart_send_times')
        .select('*')
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(1);

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        const best = data[0];
        const confidence = best.score > 20 ? 'high' : best.score > 5 ? 'medium' : 'low';
        return { day: best.day_of_week, hour: best.hour_of_day, confidence };
      }

      return { day: 2, hour: 10, confidence: 'low' as const }; // Default
    },
    enabled: !!user,
  });
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatSendTime(day: number, hour: number): string {
  const dayName = DAY_NAMES[day] || 'Tuesday';
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${dayName} at ${displayHour}:00 ${period}`;
}
