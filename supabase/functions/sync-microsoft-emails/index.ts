import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
  const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
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
    console.error('Failed to refresh Microsoft token:', await response.text());
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

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: integration, error: integrationError } = await supabaseService
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'microsoft')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      return new Response(JSON.stringify({ error: 'Microsoft integration not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let accessToken = integration.access_token;
    const tokenExpiry = new Date(integration.token_expires_at);

    if (tokenExpiry < new Date()) {
      const refreshed = await refreshAccessToken(integration.refresh_token);
      if (!refreshed) {
        return new Response(JSON.stringify({ error: 'Failed to refresh Microsoft token' }), {
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

    // Fetch emails from Microsoft Graph
    const messagesResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me/messages?$top=20&$orderby=receivedDateTime desc&$select=id,conversationId,subject,from,receivedDateTime,bodyPreview,body,isRead',
      { headers: { Authorization: `Bearer ${accessToken}`, Prefer: 'outlook.body-content-type="html"' } }
    );

    if (!messagesResponse.ok) {
      console.error('Microsoft Graph API error:', await messagesResponse.text());
      return new Response(JSON.stringify({ error: 'Failed to fetch emails' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messagesData = await messagesResponse.json();
    const messages = messagesData.value || [];

    let synced = 0;

    for (const msg of messages) {
      const fromEmail = msg.from?.emailAddress?.address || '';
      const fromName = msg.from?.emailAddress?.name || null;

      const emailData = {
        user_id: userId,
        external_id: msg.id,
        external_provider: 'microsoft',
        thread_id: msg.conversationId || null,
        subject: msg.subject || null,
        from_name: fromName,
        from_email: fromEmail,
        received_at: msg.receivedDateTime,
        body_preview: msg.bodyPreview || null,
        body_html: msg.body?.content || null,
        is_read: msg.isRead || false,
        direction: 'inbound',
      };

      const { error } = await supabaseService
        .from('emails')
        .upsert(emailData, { onConflict: 'user_id,external_id' });

      if (!error) synced++;
    }

    return new Response(JSON.stringify({ success: true, synced }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in sync-microsoft-emails:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
