import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailTemplateData {
  name: string;
  subject: string;
  body: string;
  category?: string;
}

export interface UpdateEmailTemplateData extends Partial<CreateEmailTemplateData> {
  id: string;
}

export function useEmailTemplates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['email_templates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmailTemplate[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateEmailTemplateData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: template, error } = await supabase
        .from('email_templates')
        .insert({
          user_id: user.id,
          name: data.name,
          subject: data.subject,
          body: data.body,
          category: data.category || 'general',
        })
        .select()
        .single();

      if (error) throw error;
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_templates'] });
      toast({
        title: 'Template created',
        description: 'Your email template has been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateEmailTemplateData) => {
      const { data: template, error } = await supabase
        .from('email_templates')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_templates'] });
      toast({
        title: 'Template updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_templates'] });
      toast({
        title: 'Template deleted',
        description: 'The template has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
