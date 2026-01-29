import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    console.error('Failed to refresh token:', await response.text());
    return null;
  }

  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAnon.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;

    // Get integration with service role to access tokens
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: integration, error: integrationError } = await supabaseService
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      return new Response(JSON.stringify({ error: 'Google integration not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let accessToken = integration.access_token;
    const tokenExpiry = new Date(integration.token_expires_at);

    // Refresh token if expired
    if (tokenExpiry < new Date()) {
      const refreshed = await refreshAccessToken(integration.refresh_token);
      if (!refreshed) {
        return new Response(JSON.stringify({ error: 'Failed to refresh token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      accessToken = refreshed.access_token;
      const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

      await supabaseService
        .from('user_integrations')
        .update({
          access_token: accessToken,
          token_expires_at: newExpiry,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);
    }

    // Fetch calendar events from Google Calendar API
    const now = new Date().toISOString();
    const threeMonthsFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const eventsResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${threeMonthsFromNow}&maxResults=100&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!eventsResponse.ok) {
      console.error('Calendar API error:', await eventsResponse.text());
      return new Response(JSON.stringify({ error: 'Failed to fetch calendar events' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.items || [];

    let synced = 0;

    for (const event of events) {
      if (!event.id) continue;

      const startTime = event.start?.dateTime || event.start?.date;
      const endTime = event.end?.dateTime || event.end?.date;
      const isAllDay = !event.start?.dateTime;

      if (!startTime || !endTime) continue;

      const eventData = {
        user_id: userId,
        external_id: event.id,
        external_provider: 'google',
        title: event.summary || 'Untitled Event',
        description: event.description || null,
        start_time: isAllDay ? `${startTime}T00:00:00Z` : startTime,
        end_time: isAllDay ? `${endTime}T23:59:59Z` : endTime,
        all_day: isAllDay,
        location: event.location || null,
        meeting_link: event.hangoutLink || null,
        meeting_type: event.hangoutLink ? 'google_meet' : null,
      };

      const { error } = await supabaseService
        .from('calendar_events')
        .upsert(eventData, { onConflict: 'user_id,external_id' });

      if (!error) synced++;
    }

    return new Response(JSON.stringify({ success: true, synced }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in sync-google-calendar:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
