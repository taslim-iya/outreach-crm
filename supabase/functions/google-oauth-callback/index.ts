import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Determine the redirect base URL (Settings page)
    const redirectBase = Deno.env.get('FRONTEND_URL') || 'https://lovable.dev';
    const settingsUrl = `${redirectBase}/settings`;

    if (error) {
      console.error('OAuth error:', error);
      return Response.redirect(`${settingsUrl}?google_auth=error&message=${encodeURIComponent(error)}`, 302);
    }

    if (!code || !state) {
      return Response.redirect(`${settingsUrl}?google_auth=error&message=missing_params`, 302);
    }

    // Decode state to get user ID
    let userId: string;
    try {
      const stateData = JSON.parse(atob(state));
      userId = stateData.userId;
    } catch {
      return Response.redirect(`${settingsUrl}?google_auth=error&message=invalid_state`, 302);
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-oauth-callback`;

    if (!clientId || !clientSecret) {
      return Response.redirect(`${settingsUrl}?google_auth=error&message=missing_credentials`, 302);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return Response.redirect(`${settingsUrl}?google_auth=error&message=token_exchange_failed`, 302);
    }

    const { access_token, refresh_token, expires_in, scope } = tokenData;

    // Fetch user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userInfo = await userInfoResponse.json();

    if (!userInfoResponse.ok) {
      console.error('Failed to fetch user info:', userInfo);
      return Response.redirect(`${settingsUrl}?google_auth=error&message=user_info_failed`, 302);
    }

    // Store tokens in user_integrations table using service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Upsert the integration (update if exists, insert if not)
    const { error: upsertError } = await supabase
      .from('user_integrations')
      .upsert(
        {
          user_id: userId,
          provider: 'google',
          email: userInfo.email,
          access_token,
          refresh_token,
          token_expires_at: tokenExpiresAt,
          scope,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' }
      );

    if (upsertError) {
      console.error('Failed to store integration:', upsertError);
      return Response.redirect(`${settingsUrl}?google_auth=error&message=storage_failed`, 302);
    }

    return Response.redirect(`${settingsUrl}?google_auth=success&email=${encodeURIComponent(userInfo.email)}`, 302);
  } catch (error) {
    console.error('Error in google-oauth-callback:', error);
    const redirectBase = Deno.env.get('FRONTEND_URL') || 'https://lovable.dev';
    return Response.redirect(`${redirectBase}/settings?google_auth=error&message=internal_error`, 302);
  }
});
