import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables, TablesInsert, TablesUpdate, Database } from '@/integrations/supabase/types';

export type InvestorDeal = Tables<'investor_deals'>;
export type InvestorDealInsert = TablesInsert<'investor_deals'>;
export type InvestorDealUpdate = TablesUpdate<'investor_deals'>;
export type InvestorStage = Database['public']['Enums']['investor_stage'];

interface UseInvestorDealsOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useInvestorDeals(options: UseInvestorDealsOptions = {}) {
  const { search, page, pageSize } = options;
  const { user } = useAuth();

  return useQuery({
    queryKey: ['investor_deals', user?.id, search, page, pageSize],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('investor_deals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      if (page !== undefined && pageSize !== undefined) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as InvestorDeal[];
    },
    enabled: !!user,
  });
}

export function useInvestorDealsCount(search?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['investor_deals', 'count', user?.id, search],
    queryFn: async () => {
      if (!user) return 0;

      let query = supabase
        .from('investor_deals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
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

export function useUpdateInvestorStageWithCommitment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      stage,
      commitment_amount,
    }: {
      id: string;
      stage: InvestorStage;
      commitment_amount: number;
    }) => {
      const { data, error } = await supabase
        .from('investor_deals')
        .update({ stage, commitment_amount })
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
