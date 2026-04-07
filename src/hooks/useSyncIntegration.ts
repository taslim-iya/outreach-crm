import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSyncIntegration() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const callSyncFunction = async (functionName: string, label: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
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
      if (response.status === 404 && data.error?.includes('integration not found')) {
        // Silently skip — provider not connected
        return null;
      }
      throw new Error(data.error || `Failed to sync ${label}`);
    }

    return data;
  };

  const syncEmails = async () => {
    setIsSyncing(true);
    try {
      const results = await Promise.allSettled([
        callSyncFunction('sync-google-emails', 'Gmail'),
        callSyncFunction('sync-microsoft-emails', 'Outlook'),
      ]);

      let totalSynced = 0;
      const providers: string[] = [];

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          totalSynced += result.value.synced || 0;
          providers.push(result.value.synced !== undefined ? '' : '');
        }
      }

      if (totalSynced > 0) {
        toast({
          title: 'Emails synced',
          description: `Successfully synced ${totalSynced} emails.`,
        });
      } else {
        const allSkipped = results.every(
          r => r.status === 'fulfilled' && r.value === null
        );
        if (allSkipped) {
          toast({
            title: 'No email providers connected',
            description: 'Connect Google or Microsoft in Settings to sync emails.',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to sync emails',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const syncCalendar = async () => {
    setIsSyncing(true);
    try {
      const results = await Promise.allSettled([
        callSyncFunction('sync-google-calendar', 'Google Calendar'),
        callSyncFunction('sync-microsoft-calendar', 'Microsoft Calendar'),
      ]);

      let totalSynced = 0;

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          totalSynced += result.value.synced || 0;
        }
      }

      if (totalSynced > 0) {
        toast({
          title: 'Calendar synced',
          description: `Successfully synced ${totalSynced} events.`,
        });
      } else {
        const allSkipped = results.every(
          r => r.status === 'fulfilled' && r.value === null
        );
        if (allSkipped) {
          toast({
            title: 'No calendar providers connected',
            description: 'Connect Google or Microsoft in Settings to sync calendar.',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to sync calendar',
        variant: 'destructive',
      });
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
