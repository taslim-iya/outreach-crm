import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location: string | null;
  meeting_type: string | null;
  meeting_link: string | null;
  contact_id: string | null;
  investor_deal_id: string | null;
  company_id: string | null;
  external_id: string | null;
  external_provider: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventInsert {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  location?: string | null;
  meeting_type?: string | null;
  meeting_link?: string | null;
  contact_id?: string | null;
  investor_deal_id?: string | null;
  company_id?: string | null;
}

export function useCalendarEvents(startDate?: Date, endDate?: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['calendar_events', user?.id, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('calendar_events')
        .select('*')
        .order('start_time', { ascending: true });

      if (startDate) {
        query = query.gte('start_time', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('end_time', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!user,
  });
}

export function useUpcomingEvents(limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upcoming_events', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!user,
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (event: CalendarEventInsert) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('calendar_events')
        .insert({ ...event, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming_events'] });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...event }: Partial<CalendarEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(event)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming_events'] });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming_events'] });
    },
  });
}
