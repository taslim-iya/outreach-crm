import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SequenceStatus = 'draft' | 'active' | 'paused' | 'archived';
export type TriggerType = 'manual' | 'new_contact' | 'stage_change' | 'tag_added';
export type StepType = 'email' | 'delay' | 'condition' | 'task' | 'webhook';
export type DelayUnit = 'hours' | 'days' | 'weeks';
export type ConditionType = 'opened' | 'replied' | 'clicked' | 'not_opened' | 'not_replied';
export type EnrollmentStatus = 'active' | 'completed' | 'replied' | 'bounced' | 'unsubscribed' | 'paused';

export interface Sequence {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: SequenceStatus;
  trigger_type: TriggerType;
  trigger_config: Record<string, any>;
  total_enrolled: number;
  total_completed: number;
  total_replied: number;
  created_at: string;
  updated_at: string;
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  step_type: StepType;
  subject: string | null;
  body_html: string | null;
  delay_amount: number;
  delay_unit: DelayUnit;
  condition_type: ConditionType | null;
  condition_branch_yes: string | null;
  condition_branch_no: string | null;
  task_title: string | null;
  task_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SequenceEnrollment {
  id: string;
  sequence_id: string;
  contact_id: string | null;
  email: string;
  name: string | null;
  status: EnrollmentStatus;
  current_step: number;
  enrolled_at: string;
  completed_at: string | null;
  last_action_at: string | null;
  next_action_at: string | null;
  created_at: string;
}

export interface CreateSequenceData {
  name: string;
  description?: string;
  trigger_type?: TriggerType;
  trigger_config?: Record<string, any>;
}

export interface UpdateSequenceData extends Partial<CreateSequenceData> {
  id: string;
  status?: SequenceStatus;
}

export interface CreateStepData {
  sequence_id: string;
  step_order?: number;
  step_type: StepType;
  subject?: string;
  body_html?: string;
  delay_amount?: number;
  delay_unit?: DelayUnit;
  condition_type?: ConditionType;
  task_title?: string;
  task_description?: string;
}

export interface UpdateStepData extends Partial<Omit<CreateStepData, 'sequence_id'>> {
  id: string;
  sequence_id: string;
}

export interface EnrollContactsData {
  sequence_id: string;
  contacts: Array<{
    email: string;
    name?: string;
    contact_id?: string;
  }>;
}

// ─── Sequences List ─────────────────────────────────────────────────────────

export function useSequences(search?: string, status?: SequenceStatus) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sequences', user?.id, search, status],
    queryFn: async () => {
      if (!user) return [];

      let query = (supabase as any)
        .from('sequences')
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
      return data as Sequence[];
    },
    enabled: !!user,
  });
}

// ─── Single Sequence ────────────────────────────────────────────────────────

export function useSequence(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sequence', id],
    queryFn: async () => {
      if (!user || !id) return null;

      const { data, error } = await (supabase as any)
        .from('sequences')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Sequence;
    },
    enabled: !!user && !!id,
  });
}

// ─── Create Sequence ────────────────────────────────────────────────────────

export function useCreateSequence() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateSequenceData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: sequence, error } = await (supabase as any)
        .from('sequences')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return sequence as Sequence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      toast.success('Sequence created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create sequence', { description: error.message });
    },
  });
}

// ─── Update Sequence ────────────────────────────────────────────────────────

export function useUpdateSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateSequenceData) => {
      const { data: sequence, error } = await (supabase as any)
        .from('sequences')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return sequence as Sequence;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      queryClient.invalidateQueries({ queryKey: ['sequence', data.id] });
      toast.success('Sequence updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update sequence', { description: error.message });
    },
  });
}

// ─── Delete Sequence ────────────────────────────────────────────────────────

export function useDeleteSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('sequences')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      toast.success('Sequence deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete sequence', { description: error.message });
    },
  });
}

// ─── Activate Sequence ──────────────────────────────────────────────────────

export function useActivateSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await (supabase as any)
        .from('sequences')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Sequence;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      queryClient.invalidateQueries({ queryKey: ['sequence', data.id] });
      toast.success('Sequence activated');
    },
    onError: (error: Error) => {
      toast.error('Failed to activate sequence', { description: error.message });
    },
  });
}

// ─── Pause Sequence ─────────────────────────────────────────────────────────

export function usePauseSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await (supabase as any)
        .from('sequences')
        .update({ status: 'paused', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Sequence;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      queryClient.invalidateQueries({ queryKey: ['sequence', data.id] });
      toast.success('Sequence paused');
    },
    onError: (error: Error) => {
      toast.error('Failed to pause sequence', { description: error.message });
    },
  });
}

// ─── Sequence Steps ─────────────────────────────────────────────────────────

export function useSequenceSteps(sequenceId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sequence_steps', sequenceId],
    queryFn: async () => {
      if (!sequenceId) return [];

      const { data, error } = await (supabase as any)
        .from('sequence_steps')
        .select('*')
        .eq('sequence_id', sequenceId)
        .order('step_order', { ascending: true });

      if (error) throw error;
      return data as SequenceStep[];
    },
    enabled: !!user && !!sequenceId,
  });
}

export function useCreateSequenceStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStepData) => {
      const { data: step, error } = await (supabase as any)
        .from('sequence_steps')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return step as SequenceStep;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sequence_steps', data.sequence_id] });
      toast.success('Step added');
    },
    onError: (error: Error) => {
      toast.error('Failed to add step', { description: error.message });
    },
  });
}

export function useUpdateSequenceStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sequence_id, ...data }: UpdateStepData) => {
      const { data: step, error } = await (supabase as any)
        .from('sequence_steps')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...step, sequence_id } as SequenceStep;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sequence_steps', data.sequence_id] });
      toast.success('Step updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update step', { description: error.message });
    },
  });
}

export function useDeleteSequenceStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sequenceId }: { id: string; sequenceId: string }) => {
      const { error } = await (supabase as any)
        .from('sequence_steps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { sequenceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sequence_steps', data.sequenceId] });
      toast.success('Step deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete step', { description: error.message });
    },
  });
}

export function useReorderSequenceSteps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sequenceId, steps }: { sequenceId: string; steps: { id: string; step_order: number }[] }) => {
      const promises = steps.map((step) =>
        (supabase as any)
          .from('sequence_steps')
          .update({ step_order: step.step_order, updated_at: new Date().toISOString() })
          .eq('id', step.id)
      );

      const results = await Promise.all(promises);
      const firstError = results.find((r: any) => r.error);
      if (firstError?.error) throw firstError.error;

      return { sequenceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sequence_steps', data.sequenceId] });
    },
    onError: (error: Error) => {
      toast.error('Failed to reorder steps', { description: error.message });
    },
  });
}

// ─── Sequence Enrollments ───────────────────────────────────────────────────

export function useSequenceEnrollments(sequenceId: string | undefined, status?: EnrollmentStatus) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sequence_enrollments', sequenceId, status],
    queryFn: async () => {
      if (!sequenceId) return [];

      let query = (supabase as any)
        .from('sequence_enrollments')
        .select('*')
        .eq('sequence_id', sequenceId)
        .order('enrolled_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SequenceEnrollment[];
    },
    enabled: !!user && !!sequenceId,
  });
}

export function useEnrollContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sequence_id, contacts }: EnrollContactsData) => {
      const rows = contacts.map((c) => ({
        sequence_id,
        email: c.email,
        name: c.name || null,
        contact_id: c.contact_id || null,
      }));

      const { data, error } = await (supabase as any)
        .from('sequence_enrollments')
        .insert(rows)
        .select();

      if (error) throw error;
      return data as SequenceEnrollment[];
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sequence_enrollments', variables.sequence_id] });
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      toast.success(`${_data.length} contact(s) enrolled`);
    },
    onError: (error: Error) => {
      toast.error('Failed to enroll contacts', { description: error.message });
    },
  });
}
