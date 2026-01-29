import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Document {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_type: string;
  document_type: string;
  size_bytes: number;
  company_id: string | null;
  investor_deal_id: string | null;
  contact_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useDocuments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ['documents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!user,
  });

  const uploadDocument = useMutation({
    mutationFn: async ({ 
      file, 
      documentType = 'other',
      companyId,
      investorDealId,
      contactId 
    }: { 
      file: File; 
      documentType?: string;
      companyId?: string;
      investorDealId?: string;
      contactId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          name: file.name,
          file_path: filePath,
          file_type: file.type || `application/${fileExt}`,
          document_type: documentType,
          size_bytes: file.size,
          company_id: companyId || null,
          investor_deal_id: investorDealId || null,
          contact_id: contactId || null,
        })
        .select()
        .single();

      if (error) {
        // Clean up uploaded file if metadata insert fails
        await supabase.storage.from('documents').remove([filePath]);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Document uploaded successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Upload failed', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (document: Document) => {
      if (!user) throw new Error('Not authenticated');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete metadata
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Document deleted' });
    },
    onError: (error) => {
      toast({ 
        title: 'Delete failed', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const downloadDocument = async (document: Document) => {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(document.file_path);

    if (error) {
      toast({ 
        title: 'Download failed', 
        description: error.message,
        variant: 'destructive' 
      });
      return;
    }

    // Create download link
    const url = URL.createObjectURL(data);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = document.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    error: documentsQuery.error,
    uploadDocument,
    deleteDocument,
    downloadDocument,
  };
}
