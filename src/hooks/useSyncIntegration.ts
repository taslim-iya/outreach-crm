import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSyncIntegration() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const syncEmails = async () => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-google-emails`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync emails');
      }

      toast({
        title: 'Emails synced',
        description: `Successfully synced ${data.synced} emails from Gmail.`,
      });

      return data;
    } catch (error) {
      console.error('Email sync error:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to sync emails',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncCalendar = async () => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-google-calendar`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync calendar');
      }

      toast({
        title: 'Calendar synced',
        description: `Successfully synced ${data.synced} events from Google Calendar.`,
      });

      return data;
    } catch (error) {
      console.error('Calendar sync error:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to sync calendar',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncAll = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([syncEmails(), syncCalendar()]);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    syncEmails,
    syncCalendar,
    syncAll,
  };
}
