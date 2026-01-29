import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';

export type Activity = Tables<'activities'>;

export function useActivities(limit: number = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activities', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!user,
  });
}
