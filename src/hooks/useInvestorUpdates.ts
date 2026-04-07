import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface InvestorUpdate {
  id: string;
  user_id: string;
  title: string;
  content: string;
  status: string;
  sent_at: string | null;
  recipient_count: number;
  created_at: string;
  updated_at: string;
}

export function useInvestorUpdates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['investor_updates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('investor_updates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as InvestorUpdate[];
    },
    enabled: !!user,
  });
}

export function useGenerateUpdate() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (customNotes?: string) => {
      const { data, error } = await supabase.functions.invoke('generate-investor-update', {
        body: { custom_notes: customNotes || '' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { content: string; metrics: Record<string, number> };
    },
    onError: (error) => {
      toast({ title: 'Failed to generate update', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSaveUpdate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ title, content, status }: { title: string; content: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('investor_updates')
        .insert({ user_id: user.id, title, content, status })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor_updates'] });
      toast({ title: 'Update saved' });
    },
    onError: (error) => {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
    },
  });
}
