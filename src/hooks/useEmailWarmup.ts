import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

export type WarmupReputation = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
export type WarmupProvider = 'google' | 'microsoft';

export interface EmailWarmupAccount {
  id: string;
  user_id: string;
  email_account: string;
  provider: string;
  warmup_enabled: boolean;
  daily_rampup: number;
  max_daily_sends: number;
  current_daily_limit: number;
  warmup_started_at: string | null;
  health_score: number;
  reputation: WarmupReputation;
  total_sent: number;
  total_landed_inbox: number;
  total_landed_spam: number;
  total_bounced: number;
  last_checked_at: string;
  created_at: string;
  updated_at: string;
}

export interface EmailWarmupDaily {
  id: string;
  warmup_id: string;
  date: string;
  sent: number;
  received: number;
  landed_inbox: number;
  landed_spam: number;
  bounced: number;
  replied: number;
  health_score: number;
  created_at: string;
}

export interface CreateWarmupData {
  email_account: string;
  provider?: string;
  daily_rampup?: number;
  max_daily_sends?: number;
  current_daily_limit?: number;
}

export interface UpdateWarmupData {
  id: string;
  warmup_enabled?: boolean;
  daily_rampup?: number;
  max_daily_sends?: number;
  current_daily_limit?: number;
}

// ─── List All Warmup Accounts ───────────────────────────────────────────────

export function useEmailWarmupAccounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['email_warmup', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from('email_warmup')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmailWarmupAccount[];
    },
    enabled: !!user,
  });
}

// ─── Single Warmup Account ──────────────────────────────────────────────────

export function useEmailWarmupAccount(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['email_warmup', id],
    queryFn: async () => {
      if (!user || !id) return null;

      const { data, error } = await (supabase as any)
        .from('email_warmup')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as EmailWarmupAccount;
    },
    enabled: !!user && !!id,
  });
}

// ─── Create Warmup Account ──────────────────────────────────────────────────

export function useCreateWarmupAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateWarmupData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: account, error } = await (supabase as any)
        .from('email_warmup')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return account as EmailWarmupAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_warmup'] });
      toast.success('Warmup account added');
    },
    onError: (error: Error) => {
      toast.error('Failed to add warmup account', { description: error.message });
    },
  });
}

// ─── Update Warmup Account ──────────────────────────────────────────────────

export function useUpdateWarmupAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateWarmupData) => {
      const { data: account, error } = await (supabase as any)
        .from('email_warmup')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return account as EmailWarmupAccount;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email_warmup'] });
      queryClient.invalidateQueries({ queryKey: ['email_warmup', data.id] });
      toast.success('Warmup settings updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update warmup settings', { description: error.message });
    },
  });
}

// ─── Delete Warmup Account ──────────────────────────────────────────────────

export function useDeleteWarmupAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('email_warmup')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_warmup'] });
      toast.success('Warmup account removed');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove warmup account', { description: error.message });
    },
  });
}

// ─── Daily Stats ────────────────────────────────────────────────────────────

export function useWarmupDailyStats(warmupId: string | undefined, days = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['email_warmup_daily', warmupId, days],
    queryFn: async () => {
      if (!warmupId) return [];

      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await (supabase as any)
        .from('email_warmup_daily')
        .select('*')
        .eq('warmup_id', warmupId)
        .gte('date', since.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return data as EmailWarmupDaily[];
    },
    enabled: !!user && !!warmupId,
  });
}
