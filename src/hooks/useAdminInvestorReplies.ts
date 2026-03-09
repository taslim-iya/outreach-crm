import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface InvestorReplyStatus {
  investor_deal_id: string;
  investor_name: string;
  organization: string | null;
  stage: string;
  owner_user_id: string;
  owner_email: string | null;
  contact_email: string | null;
  last_outbound_at: string | null;
  first_inbound_after_outbound_at: string | null;
  reply_status: 'replied' | 'pending' | 'not_contacted';
}

export function useAdminInvestorReplies() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-investor-replies', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_investor_reply_status');
      if (error) throw error;
      return (data as unknown as InvestorReplyStatus[]) || [];
    },
    enabled: !!user,
  });
}
