import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ICMemo {
  id: string;
  user_id: string;
  deal_id: string;
  thesis: string | null;
  business_overview: string | null;
  quality_assessment: string | null;
  risks: string | null;
  key_questions: string | null;
  valuation_snapshot: string | null;
  recommendation: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecisionLogEntry {
  id: string;
  user_id: string;
  deal_id: string;
  decision_date: string;
  decision: string;
  rationale: string | null;
  next_action: string | null;
  lessons_learned: string | null;
  reason_codes: string[] | null;
  created_at: string;
}

export function useICMemo(dealId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ic-memo', dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ic_memos')
        .select('*')
        .eq('user_id', user!.id)
        .eq('deal_id', dealId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ICMemo | null;
    },
    enabled: !!user && !!dealId,
  });
}

export function useUpsertICMemo() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (memo: Partial<ICMemo> & { deal_id: string }) => {
      if (memo.id) {
        const { id, ...updates } = memo;
        const { data, error } = await supabase
          .from('ic_memos')
          .update(updates as Record<string, unknown>)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('ic_memos')
          .insert({ ...memo, user_id: user!.id } as Record<string, unknown>)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ic-memo'] });
      toast.success('IC Memo saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDecisionLog(dealId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['decision-log', dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('decision_log')
        .select('*')
        .eq('user_id', user!.id)
        .eq('deal_id', dealId!)
        .order('decision_date', { ascending: false });
      if (error) throw error;
      return data as DecisionLogEntry[];
    },
    enabled: !!user && !!dealId,
  });
}

export function useCreateDecisionLogEntry() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entry: Partial<DecisionLogEntry> & { deal_id: string }) => {
      const { data, error } = await supabase
        .from('decision_log')
        .insert({ ...entry, user_id: user!.id } as Record<string, unknown>)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decision-log'] });
      toast.success('Decision logged');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSavedFilters(entityType: string = 'company') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['saved-filters', entityType, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('user_id', user!.id)
        .eq('entity_type', entityType)
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateSavedFilter() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (filter: { name: string; filter_config: Record<string, unknown>; entity_type: string }) => {
      const { data, error } = await supabase
        .from('saved_filters')
        .insert({ ...filter, user_id: user!.id } as Record<string, unknown>)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters'] });
      toast.success('Filter saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSavedFilter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('saved_filters').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters'] });
      toast.success('Filter deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
