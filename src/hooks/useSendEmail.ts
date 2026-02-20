import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendEmailData {
  to: string;
  subject: string;
  body: string;
  reply_to?: string;
  from_name?: string;
  attachment_doc_ids?: string[];
}

export function useSendEmail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: SendEmailData) => {
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: data,
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['unread_emails_count'] });
      toast({
        title: 'Email sent',
        description: 'Your email has been sent successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send email',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
