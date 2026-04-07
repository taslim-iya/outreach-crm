import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Contact = Tables<'contacts'>;
export type ContactInsert = TablesInsert<'contacts'>;
export type ContactUpdate = TablesUpdate<'contacts'>;

interface UseContactsOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useContacts(options: UseContactsOptions = {}) {
  const { search, page, pageSize } = options;
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contacts', user?.id, search, page, pageSize],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      if (page !== undefined && pageSize !== undefined) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!user,
  });
}

export function useContactsCount(search?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contacts', 'count', user?.id, search],
    queryFn: async () => {
      if (!user) return 0;

      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (contact: Omit<ContactInsert, 'user_id'>) => {
      if (!user) throw new Error('User not authenticated');

      // Deduplicate: check for existing contact by email or name+organization
      let existingContact: Contact | null = null;

      if (contact.email) {
        const { data } = await supabase
          .from('contacts')
          .select('*')
          .eq('email', contact.email)
          .maybeSingle();
        if (data) existingContact = data as Contact;
      }

      if (!existingContact && contact.name) {
        let query = supabase
          .from('contacts')
          .select('*')
          .eq('name', contact.name);
        if (contact.organization) {
          query = query.eq('organization', contact.organization);
        }
        const { data } = await query.maybeSingle();
        if (data) existingContact = data as Contact;
      }

      if (existingContact) {
        // Merge: update existing contact with any new non-null fields
        const updates: Record<string, any> = {};
        const fields = ['phone', 'organization', 'role', 'geography', 'source', 'notes', 'contact_type', 'warmth', 'influence', 'likelihood'] as const;
        for (const field of fields) {
          if (contact[field] != null && contact[field] !== '' && !existingContact[field]) {
            updates[field] = contact[field];
          }
        }
        // Merge tags
        if (contact.tags && contact.tags.length > 0) {
          const existingTags = existingContact.tags || [];
          const merged = [...new Set([...existingTags, ...contact.tags])];
          if (merged.length !== existingTags.length) updates.tags = merged;
        }
        // Update email if not set
        if (contact.email && !existingContact.email) {
          updates.email = contact.email;
        }

        if (Object.keys(updates).length > 0) {
          const { data, error } = await supabase
            .from('contacts')
            .update(updates)
            .eq('id', existingContact.id)
            .select()
            .single();
          if (error) throw error;
          return data;
        }
        return existingContact;
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert({ ...contact, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...contact }: ContactUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(contact)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
