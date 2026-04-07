import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Email {
  id: string;
  user_id: string;
  subject: string | null;
  body_preview: string | null;
  body_html: string | null;
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
  direction: string;
  open_count: number;
  first_opened_at: string | null;
  last_opened_at: string | null;
  tracking_id: string | null;
}

interface UseEmailsOptions {
  limit?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useEmails(limitOrOptions: number | UseEmailsOptions = 20) {
  const options: UseEmailsOptions = typeof limitOrOptions === 'number'
    ? { limit: limitOrOptions }
    : limitOrOptions;
  const { limit = 20, search, page, pageSize } = options;
  const { user } = useAuth();

  return useQuery({
    queryKey: ['emails', user?.id, limit, search, page, pageSize],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('emails')
        .select('*')
        .eq('user_id', user.id)
        .order('received_at', { ascending: false });

      if (search) {
        query = query.or(`subject.ilike.%${search}%,from_email.ilike.%${search}%`);
      }

      if (page !== undefined && pageSize !== undefined) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      } else {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Email[];
    },
    enabled: !!user,
  });
}

export function useEmailsCount(search?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['emails', 'count', user?.id, search],
    queryFn: async () => {
      if (!user) return 0;

      let query = supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (search) {
        query = query.or(`subject.ilike.%${search}%,from_email.ilike.%${search}%`);
      }

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
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
        .eq('user_id', user.id)
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
