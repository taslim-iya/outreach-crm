import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FollowUpSequence {
  id: string;
  user_id: string;
  investor_deal_id: string | null;
  company_id: string | null;
  contact_id: string | null;
  template_id: string | null;
  interval_days: number;
  follow_up_number: number;
  max_follow_ups: number;
  status: string;
  next_send_at: string | null;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useFollowUpSequences(investorDealId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['follow_up_sequences', user?.id, investorDealId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('follow_up_sequences')
        .select('*')
        .order('created_at', { ascending: false });

      if (investorDealId) {
        query = query.eq('investor_deal_id', investorDealId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FollowUpSequence[];
    },
    enabled: !!user,
  });
}

export function useCreateFollowUpSequence() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sequence: {
      investor_deal_id?: string;
      company_id?: string;
      contact_id?: string;
      template_id?: string;
      interval_days: number;
      max_follow_ups: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const nextSendAt = new Date();
      nextSendAt.setDate(nextSendAt.getDate() + sequence.interval_days);

      const { data, error } = await supabase
        .from('follow_up_sequences')
        .insert({
          ...sequence,
          user_id: user.id,
          next_send_at: nextSendAt.toISOString(),
          follow_up_number: 1,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow_up_sequences'] });
    },
  });
}

export function useUpdateFollowUpSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; interval_days?: number; max_follow_ups?: number }) => {
      const { data, error } = await supabase
        .from('follow_up_sequences')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow_up_sequences'] });
    },
  });
}

export function useDeleteFollowUpSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('follow_up_sequences')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow_up_sequences'] });
    },
  });
}

// Hook to get emails sent to a specific investor
export function useInvestorEmails(investorDealId?: string, contactId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['investor_emails', user?.id, investorDealId, contactId],
    queryFn: async () => {
      if (!user || !contactId) return [];

      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!contactId,
  });
}
