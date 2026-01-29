import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserIntegration {
  id: string;
  user_id: string;
  provider: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useUserIntegrations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user_integrations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_integrations')
        .select('id, user_id, provider, email, is_active, created_at, updated_at')
        .eq('is_active', true);

      if (error) throw error;
      return data as UserIntegration[];
    },
    enabled: !!user,
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: string) => {
      const { error } = await supabase
        .from('user_integrations')
        .update({ is_active: false })
        .eq('provider', provider);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_integrations'] });
    },
  });
}
