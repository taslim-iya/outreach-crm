import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Email {
  id: string;
  user_id: string;
  subject: string | null;
  body_preview: string | null;
  from_email: string | null;
  from_name: string | null;
  to_emails: string[] | null;
  received_at: string | null;
  is_read: boolean;
  thread_id: string | null;
  contact_id: string | null;
  external_id: string | null;
  external_provider: string | null;
  created_at: string;
}

export function useEmails(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['emails', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Email[];
    },
    enabled: !!user,
  });
}

export function useUnreadEmailCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread_emails_count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const { count, error } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}

export function useMarkEmailAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('emails')
        .update({ is_read: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['unread_emails_count'] });
    },
  });
}
