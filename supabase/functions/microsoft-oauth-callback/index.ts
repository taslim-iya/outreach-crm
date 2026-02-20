import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    const redirectBase = Deno.env.get('FRONTEND_URL') || 'https://lovable.dev';
    const settingsUrl = `${redirectBase}/settings`;

    if (error) {
      console.error('Microsoft OAuth error:', error, 'Description:', errorDescription);
      const msg = errorDescription || error;
      return Response.redirect(`${settingsUrl}?microsoft_auth=error&message=${encodeURIComponent(msg)}`, 302);
    }

    if (!code || !state) {
      return Response.redirect(`${settingsUrl}?microsoft_auth=error&message=missing_params`, 302);
    }

    let userId: string;
    try {
      const stateData = JSON.parse(atob(state));
      userId = stateData.userId;
    } catch {
      return Response.redirect(`${settingsUrl}?microsoft_auth=error&message=invalid_state`, 302);
    }

    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/microsoft-oauth-callback`;

    if (!clientId || !clientSecret) {
      return Response.redirect(`${settingsUrl}?microsoft_auth=error&message=missing_credentials`, 302);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/organizations/oauth2/v2.0/token', {
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
      console.error('Microsoft token exchange failed:', tokenData);
      return Response.redirect(`${settingsUrl}?microsoft_auth=error&message=token_exchange_failed`, 302);
    }

    const { access_token, refresh_token, expires_in, scope } = tokenData;

    // Fetch user info from Microsoft Graph
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userInfo = await userInfoResponse.json();

    if (!userInfoResponse.ok) {
      console.error('Failed to fetch Microsoft user info:', userInfo);
      return Response.redirect(`${settingsUrl}?microsoft_auth=error&message=user_info_failed`, 302);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    const { error: upsertError } = await supabase
      .from('user_integrations')
      .upsert(
        {
          user_id: userId,
          provider: 'microsoft',
          email: userInfo.mail || userInfo.userPrincipalName,
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
      console.error('Failed to store Microsoft integration:', upsertError);
      return Response.redirect(`${settingsUrl}?microsoft_auth=error&message=storage_failed`, 302);
    }

    const email = userInfo.mail || userInfo.userPrincipalName || '';
    return Response.redirect(`${settingsUrl}?microsoft_auth=success&email=${encodeURIComponent(email)}`, 302);
  } catch (error) {
    console.error('Error in microsoft-oauth-callback:', error);
    const redirectBase = Deno.env.get('FRONTEND_URL') || 'https://lovable.dev';
    return Response.redirect(`${redirectBase}/settings?microsoft_auth=error&message=internal_error`, 302);
  }
});
