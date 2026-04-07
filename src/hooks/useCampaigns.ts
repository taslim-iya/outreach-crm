import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type RecipientStatus = 'pending' | 'sent' | 'opened' | 'replied' | 'bounced' | 'unsubscribed' | 'failed';
export type StepType = 'email' | 'delay' | 'condition';

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  status: CampaignStatus;
  from_name: string | null;
  from_email: string | null;
  subject: string | null;
  body_html: string | null;
  body_text: string | null;
  schedule_start: string | null;
  schedule_end: string | null;
  send_days: string[];
  send_start_hour: number;
  send_end_hour: number;
  timezone: string;
  daily_limit: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignStep {
  id: string;
  campaign_id: string;
  step_number: number;
  step_type: StepType;
  subject: string | null;
  body_html: string | null;
  body_text: string | null;
  delay_days: number;
  variant_key: string;
  created_at: string;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  contact_id: string | null;
  email: string;
  name: string | null;
  status: RecipientStatus;
  current_step: number;
  last_sent_at: string | null;
  opened_at: string | null;
  replied_at: string | null;
  bounced_at: string | null;
  variant_key: string;
  created_at: string;
}

export interface CampaignAnalyticsRow {
  id: string;
  campaign_id: string;
  date: string;
  sent: number;
  opened: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  created_at: string;
}

export interface CreateCampaignData {
  name: string;
  from_name?: string;
  from_email?: string;
  subject?: string;
  body_html?: string;
  body_text?: string;
  schedule_start?: string;
  schedule_end?: string;
  send_days?: string[];
  send_start_hour?: number;
  send_end_hour?: number;
  timezone?: string;
  daily_limit?: number;
}

export interface UpdateCampaignData extends Partial<CreateCampaignData> {
  id: string;
  status?: CampaignStatus;
}

export interface CreateStepData {
  campaign_id: string;
  step_number?: number;
  step_type?: StepType;
  subject?: string;
  body_html?: string;
  body_text?: string;
  delay_days?: number;
  variant_key?: string;
}

export interface UpdateStepData extends Partial<Omit<CreateStepData, 'campaign_id'>> {
  id: string;
}

export interface AddRecipientsData {
  campaign_id: string;
  recipients: Array<{
    email: string;
    name?: string;
    contact_id?: string;
    variant_key?: string;
  }>;
}

// ─── Campaign List ───────────────────────────────────────────────────────────

export function useCampaigns(search?: string, status?: CampaignStatus) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaigns', user?.id, search, status],
    queryFn: async () => {
      if (!user) return [];

      let query = (supabase as any)
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!user,
  });
}

// ─── Single Campaign ─────────────────────────────────────────────────────────

export function useCampaign(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      if (!user || !id) return null;

      const { data, error } = await (supabase as any)
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Campaign;
    },
    enabled: !!user && !!id,
  });
}

// ─── Create Campaign ─────────────────────────────────────────────────────────

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateCampaignData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: campaign, error } = await (supabase as any)
        .from('campaigns')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return campaign as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create campaign', { description: error.message });
    },
  });
}

// ─── Update Campaign ─────────────────────────────────────────────────────────

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateCampaignData) => {
      const { data: campaign, error } = await (supabase as any)
        .from('campaigns')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return campaign as Campaign;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', data.id] });
      toast.success('Campaign updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update campaign', { description: error.message });
    },
  });
}

// ─── Delete Campaign ─────────────────────────────────────────────────────────

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete campaign', { description: error.message });
    },
  });
}

// ─── Activate / Pause ────────────────────────────────────────────────────────

export function useActivateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await (supabase as any)
        .from('campaigns')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', data.id] });
      toast.success('Campaign activated');
    },
    onError: (error: Error) => {
      toast.error('Failed to activate campaign', { description: error.message });
    },
  });
}

export function usePauseCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await (supabase as any)
        .from('campaigns')
        .update({ status: 'paused', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', data.id] });
      toast.success('Campaign paused');
    },
    onError: (error: Error) => {
      toast.error('Failed to pause campaign', { description: error.message });
    },
  });
}

// ─── Campaign Steps ──────────────────────────────────────────────────────────

export function useCampaignSteps(campaignId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaign_steps', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];

      const { data, error } = await (supabase as any)
        .from('campaign_steps')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('step_number', { ascending: true });

      if (error) throw error;
      return data as CampaignStep[];
    },
    enabled: !!user && !!campaignId,
  });
}

export function useCreateCampaignStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStepData) => {
      const { data: step, error } = await (supabase as any)
        .from('campaign_steps')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return step as CampaignStep;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign_steps', data.campaign_id] });
      toast.success('Step added');
    },
    onError: (error: Error) => {
      toast.error('Failed to add step', { description: error.message });
    },
  });
}

export function useUpdateCampaignStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateStepData) => {
      const { data: step, error } = await (supabase as any)
        .from('campaign_steps')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return step as CampaignStep;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign_steps', data.campaign_id] });
      toast.success('Step updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update step', { description: error.message });
    },
  });
}

export function useDeleteCampaignStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, campaignId }: { id: string; campaignId: string }) => {
      const { error } = await (supabase as any)
        .from('campaign_steps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { campaignId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign_steps', data.campaignId] });
      toast.success('Step deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete step', { description: error.message });
    },
  });
}

// ─── Campaign Recipients ─────────────────────────────────────────────────────

export function useCampaignRecipients(campaignId: string | undefined, status?: RecipientStatus) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaign_recipients', campaignId, status],
    queryFn: async () => {
      if (!campaignId) return [];

      let query = (supabase as any)
        .from('campaign_recipients')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CampaignRecipient[];
    },
    enabled: !!user && !!campaignId,
  });
}

export function useAddCampaignRecipients() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaign_id, recipients }: AddRecipientsData) => {
      const rows = recipients.map((r) => ({
        campaign_id,
        email: r.email,
        name: r.name || null,
        contact_id: r.contact_id || null,
        variant_key: r.variant_key || 'A',
      }));

      const { data, error } = await (supabase as any)
        .from('campaign_recipients')
        .insert(rows)
        .select();

      if (error) throw error;
      return data as CampaignRecipient[];
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign_recipients', variables.campaign_id] });
      toast.success(`${_data.length} recipient(s) added`);
    },
    onError: (error: Error) => {
      toast.error('Failed to add recipients', { description: error.message });
    },
  });
}

// ─── Campaign Analytics ──────────────────────────────────────────────────────

export function useCampaignAnalytics(campaignId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaign_analytics', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];

      const { data, error } = await (supabase as any)
        .from('campaign_analytics')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as CampaignAnalyticsRow[];
    },
    enabled: !!user && !!campaignId,
  });
}
