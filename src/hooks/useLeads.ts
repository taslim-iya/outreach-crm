import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  company: string | null;
  company_size: string | null;
  industry: string | null;
  location: string | null;
  linkedin_url: string | null;
  website: string | null;
  source: string | null;
  status: string;
  score: number;
  tags: string[];
  enriched: boolean;
  enriched_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadInsert {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  company?: string | null;
  company_size?: string | null;
  industry?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  website?: string | null;
  source?: string | null;
  status?: string;
  score?: number;
  tags?: string[];
}

export interface LeadUpdate extends Partial<LeadInsert> {
  id: string;
}

export interface LeadFilters {
  search?: string;
  industry?: string[];
  companySize?: string[];
  location?: string;
  status?: string[];
  minScore?: number;
  maxScore?: number;
  tags?: string[];
  title?: string;
  page?: number;
  pageSize?: number;
}

export interface LeadSearch {
  id: string;
  user_id: string;
  name: string;
  filters: LeadFilters;
  result_count: number;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function applyFilters(query: any, filters: LeadFilters) {
  if (filters.search) {
    const s = `%${filters.search}%`;
    query = query.or(
      `first_name.ilike.${s},last_name.ilike.${s},email.ilike.${s},company.ilike.${s}`
    );
  }

  if (filters.title) {
    query = query.ilike('title', `%${filters.title}%`);
  }

  if (filters.industry && filters.industry.length > 0) {
    query = query.in('industry', filters.industry);
  }

  if (filters.companySize && filters.companySize.length > 0) {
    query = query.in('company_size', filters.companySize);
  }

  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters.minScore !== undefined && filters.minScore !== null) {
    query = query.gte('score', filters.minScore);
  }

  if (filters.maxScore !== undefined && filters.maxScore !== null) {
    query = query.lte('score', filters.maxScore);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  return query;
}

// ─── Leads List ──────────────────────────────────────────────────────────────

export function useLeads(filters: LeadFilters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leads', user?.id, filters],
    queryFn: async () => {
      if (!user) return [];

      let query = (supabase as any)
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      query = applyFilters(query, filters);

      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 25;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!user,
  });
}

// ─── Leads Count ─────────────────────────────────────────────────────────────

export function useLeadsCount(filters: LeadFilters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leads', 'count', user?.id, filters],
    queryFn: async () => {
      if (!user) return 0;

      let query = (supabase as any)
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      query = applyFilters(query, filters);

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}

// ─── Create Lead ─────────────────────────────────────────────────────────────

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (lead: LeadInsert) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await (supabase as any)
        .from('leads')
        .insert({ ...lead, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create lead', { description: error.message });
    },
  });
}

// ─── Bulk Create Leads ───────────────────────────────────────────────────────

export function useBulkCreateLeads() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (leads: LeadInsert[]) => {
      if (!user) throw new Error('User not authenticated');

      const rows = leads.map((lead) => ({ ...lead, user_id: user.id }));
      const { data, error } = await (supabase as any)
        .from('leads')
        .insert(rows)
        .select();

      if (error) throw error;
      return data as Lead[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`${data.length} lead(s) imported`);
    },
    onError: (error: Error) => {
      toast.error('Failed to import leads', { description: error.message });
    },
  });
}

// ─── Update Lead ─────────────────────────────────────────────────────────────

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...lead }: LeadUpdate) => {
      const { data, error } = await (supabase as any)
        .from('leads')
        .update({ ...lead, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update lead', { description: error.message });
    },
  });
}

// ─── Delete Lead ─────────────────────────────────────────────────────────────

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete lead', { description: error.message });
    },
  });
}

// ─── Bulk Delete Leads ───────────────────────────────────────────────────────

export function useBulkDeleteLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await (supabase as any)
        .from('leads')
        .delete()
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Leads deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete leads', { description: error.message });
    },
  });
}

// ─── Lead Searches ───────────────────────────────────────────────────────────

export function useLeadSearches() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lead_searches', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from('lead_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LeadSearch[];
    },
    enabled: !!user,
  });
}

export function useSaveLeadSearch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, filters, resultCount }: { name: string; filters: LeadFilters; resultCount: number }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await (supabase as any)
        .from('lead_searches')
        .insert({
          user_id: user.id,
          name,
          filters,
          result_count: resultCount,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LeadSearch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead_searches'] });
      toast.success('Search saved');
    },
    onError: (error: Error) => {
      toast.error('Failed to save search', { description: error.message });
    },
  });
}

export function useDeleteLeadSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('lead_searches')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead_searches'] });
      toast.success('Saved search deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete saved search', { description: error.message });
    },
  });
}

// ─── Convert Lead to Contact ─────────────────────────────────────────────────

export function useConvertLeadToContact() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (leadId: string) => {
      if (!user) throw new Error('User not authenticated');

      // Fetch the lead
      const { data: lead, error: fetchError } = await (supabase as any)
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (fetchError) throw fetchError;

      const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown';

      // Create a contact
      const { data: contact, error: insertError } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          name: fullName,
          email: lead.email || null,
          phone: lead.phone || null,
          organization: lead.company || null,
          role: lead.title || null,
          geography: lead.location || null,
          source: lead.source || 'lead-finder',
          tags: lead.tags || [],
          contact_type: 'other',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update lead status to converted
      await (supabase as any)
        .from('leads')
        .update({ status: 'converted', updated_at: new Date().toISOString() })
        .eq('id', leadId);

      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Lead converted to contact');
    },
    onError: (error: Error) => {
      toast.error('Failed to convert lead', { description: error.message });
    },
  });
}
