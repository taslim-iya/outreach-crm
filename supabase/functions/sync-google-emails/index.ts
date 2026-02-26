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

    // Fetch emails from Gmail API
    const messagesResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&labelIds=INBOX',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!messagesResponse.ok) {
      console.error('Gmail API error:', await messagesResponse.text());
      return new Response(JSON.stringify({ error: 'Failed to fetch emails' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messagesData = await messagesResponse.json();
    const messages = messagesData.messages || [];

    let synced = 0;

    for (const msg of messages.slice(0, 20)) {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!msgResponse.ok) continue;

      const msgData = await msgResponse.json();
      const headers = msgData.payload?.headers || [];

      const getHeader = (name: string) => headers.find((h: { name: string; value: string }) => h.name === name)?.value || null;

      const fromHeader = getHeader('From') || '';
      const fromMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/) || [null, null, fromHeader];
      const fromName = fromMatch[1]?.trim() || null;
      const fromEmail = fromMatch[2]?.trim() || fromHeader;

      // Extract full body from payload
      let bodyHtml = '';
      const extractBody = (payload: any): string => {
        if (payload.mimeType === 'text/html' && payload.body?.data) {
          return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
        if (payload.mimeType === 'text/plain' && payload.body?.data && !bodyHtml) {
          const plain = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          return plain.split('\n').map((line: string) => line.trim() === '' ? '<br>' : `<p>${line}</p>`).join('');
        }
        if (payload.parts) {
          for (const part of payload.parts) {
            const result = extractBody(part);
            if (result) return result;
          }
        }
        return '';
      };
      bodyHtml = extractBody(msgData.payload);

      const emailData = {
        user_id: userId,
        external_id: msg.id,
        external_provider: 'google',
        thread_id: msg.threadId,
        subject: getHeader('Subject'),
        from_name: fromName,
        from_email: fromEmail,
        received_at: new Date(parseInt(msgData.internalDate)).toISOString(),
        body_preview: msgData.snippet || null,
        body_html: bodyHtml || null,
        is_read: !msgData.labelIds?.includes('UNREAD'),
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
    console.error('Error in sync-google-emails:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
