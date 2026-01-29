import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables, TablesInsert, TablesUpdate, Database } from '@/integrations/supabase/types';

export type InvestorDeal = Tables<'investor_deals'>;
export type InvestorDealInsert = TablesInsert<'investor_deals'>;
export type InvestorDealUpdate = TablesUpdate<'investor_deals'>;
export type InvestorStage = Database['public']['Enums']['investor_stage'];

export function useInvestorDeals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['investor_deals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('investor_deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InvestorDeal[];
    },
    enabled: !!user,
  });
}

export function useCreateInvestorDeal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (deal: Omit<InvestorDealInsert, 'user_id'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('investor_deals')
        .insert({ ...deal, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor_deals'] });
    },
  });
}

export function useUpdateInvestorDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...deal }: InvestorDealUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('investor_deals')
        .update(deal)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor_deals'] });
    },
  });
}

export function useDeleteInvestorDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('investor_deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor_deals'] });
    },
  });
}

export function useUpdateInvestorStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: InvestorStage }) => {
      const { data, error } = await supabase
        .from('investor_deals')
        .update({ stage })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor_deals'] });
    },
  });
}
