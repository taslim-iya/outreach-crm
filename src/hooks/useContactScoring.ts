import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Point values for different engagement types
const ENGAGEMENT_POINTS: Record<string, number> = {
  email_sent: 1,
  email_opened: 3,
  email_replied: 10,
  email_clicked: 5,
  meeting_scheduled: 15,
  meeting_completed: 20,
  note_added: 2,
  task_completed: 5,
  deal_created: 25,
  call_made: 8,
};

export function useContactEngagement(contactId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contact-engagement', user?.id, contactId],
    queryFn: async () => {
      if (!user || !contactId) return [];
      const { data, error } = await supabase
        .from('contact_engagement')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!contactId,
  });
}

export function useTrackEngagement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ contactId, eventType, metadata }: { contactId: string; eventType: string; metadata?: Record<string, unknown> }) => {
      if (!user) throw new Error('Not authenticated');
      const points = ENGAGEMENT_POINTS[eventType] || 0;

      // Insert engagement record
      const { error: engError } = await supabase
        .from('contact_engagement')
        .insert({ user_id: user.id, contact_id: contactId, event_type: eventType, points, metadata: metadata || {} });
      if (engError) throw engError;

      // Update contact's total score
      const { data: engagements } = await supabase
        .from('contact_engagement')
        .select('points')
        .eq('user_id', user.id)
        .eq('contact_id', contactId);

      const totalScore = (engagements || []).reduce((sum, e) => sum + (e.points || 0), 0);

      const { error: updateError } = await supabase
        .from('contacts')
        .update({ engagement_score: totalScore, last_engagement_at: new Date().toISOString() })
        .eq('id', contactId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-engagement'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useTopScoredContacts(limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['top-scored-contacts', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('engagement_score', { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
