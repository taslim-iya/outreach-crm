import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DiligenceItem {
  id: string;
  user_id: string;
  deal_id: string;
  title: string;
  category: string | null;
  status: string | null;
  owner: string | null;
  due_date: string | null;
  doc_link: string | null;
  comments: string | null;
  stage_template: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface RequestItem {
  id: string;
  user_id: string;
  deal_id: string;
  item_name: string;
  requested_date: string | null;
  status: string | null;
  received_date: string | null;
  file_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useDiligenceItems(dealId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['diligence-items', dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diligence_items')
        .select('*')
        .eq('user_id', user!.id)
        .eq('deal_id', dealId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as DiligenceItem[];
    },
    enabled: !!user && !!dealId,
  });
}

export function useCreateDiligenceItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (item: Partial<DiligenceItem>) => {
      const { data, error } = await supabase
        .from('diligence_items')
        .insert({ ...item, user_id: user!.id } as Record<string, unknown>)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diligence-items'] });
      toast.success('Diligence item added');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateDiligenceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DiligenceItem> & { id: string }) => {
      const { error } = await supabase
        .from('diligence_items')
        .update(updates as Record<string, unknown>)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diligence-items'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDiligenceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('diligence_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diligence-items'] });
      toast.success('Item removed');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRequestItems(dealId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['request-items', dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('request_items')
        .select('*')
        .eq('user_id', user!.id)
        .eq('deal_id', dealId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RequestItem[];
    },
    enabled: !!user && !!dealId,
  });
}

export function useCreateRequestItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (item: Partial<RequestItem>) => {
      const { data, error } = await supabase
        .from('request_items')
        .insert({ ...item, user_id: user!.id } as Record<string, unknown>)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request-items'] });
      toast.success('Request item added');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateRequestItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RequestItem> & { id: string }) => {
      const { error } = await supabase
        .from('request_items')
        .update(updates as Record<string, unknown>)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request-items'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
