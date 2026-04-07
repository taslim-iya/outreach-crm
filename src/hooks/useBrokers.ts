import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Broker {
  id: string;
  user_id: string;
  firm: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  coverage_sector: string | null;
  coverage_geo: string | null;
  responsiveness_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface UseBrokersOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useBrokers(options: UseBrokersOptions = {}) {
  const { search, page, pageSize } = options;
  const { user } = useAuth();

  return useQuery({
    queryKey: ['brokers', user?.id, search, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('brokers')
        .select('*')
        .eq('user_id', user!.id)
        .order('firm', { ascending: true });

      if (search) {
        query = query.or(`firm.ilike.%${search}%,contact_name.ilike.%${search}%`);
      }

      if (page !== undefined && pageSize !== undefined) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Broker[];
    },
    enabled: !!user,
  });
}

export function useBrokersCount(search?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['brokers', 'count', user?.id, search],
    queryFn: async () => {
      if (!user) return 0;

      let query = supabase
        .from('brokers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (search) {
        query = query.or(`firm.ilike.%${search}%,contact_name.ilike.%${search}%`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}

export function useCreateBroker() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (broker: Partial<Broker>) => {
      const { data, error } = await supabase
        .from('brokers')
        .insert({ ...broker, user_id: user!.id } as Record<string, unknown>)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      toast.success('Broker added');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBroker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Broker> & { id: string }) => {
      const { data, error } = await supabase
        .from('brokers')
        .update(updates as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      toast.success('Broker updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBroker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('brokers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      toast.success('Broker deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
