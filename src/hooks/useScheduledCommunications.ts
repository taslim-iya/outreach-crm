import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ScheduledCommunication {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string | null;
  recipient_type: string;
  recipient_ids: string[];
  scheduled_for: string;
  recurrence: string;
  auto_send: boolean;
  status: string;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useScheduledCommunications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['scheduled_communications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('scheduled_communications' as any)
        .select('*')
        .order('scheduled_for', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ScheduledCommunication[];
    },
    enabled: !!user,
  });
}

export function useCreateScheduledCommunication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<ScheduledCommunication, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_sent_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('scheduled_communications' as any)
        .insert({ ...input, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled_communications'] });
      toast.success('Communication scheduled');
    },
    onError: (error) => {
      toast.error('Failed to schedule: ' + error.message);
    },
  });
}

export function useUpdateScheduledCommunication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ScheduledCommunication> & { id: string }) => {
      const { data, error } = await supabase
        .from('scheduled_communications' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled_communications'] });
      toast.success('Schedule updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });
}

export function useDeleteScheduledCommunication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_communications' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled_communications'] });
      toast.success('Scheduled item removed');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });
}
