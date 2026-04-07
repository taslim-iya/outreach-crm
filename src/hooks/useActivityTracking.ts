import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useActivityTracking() {
  const { user } = useAuth();

  const trackEvent = useCallback(async (eventType: string, eventData?: Record<string, unknown>) => {
    if (!user) return;
    try {
      await supabase.from('user_activity_log').insert([{
        user_id: user.id,
        event_type: eventType,
        event_data: (eventData || {}) as Record<string, unknown>,
      }]);
    } catch {
      // Silently fail - tracking should never block UX
    }
  }, [user]);

  return { trackEvent };
}
