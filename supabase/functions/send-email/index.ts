import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Token refresh helpers ---

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    console.error("Failed to refresh Google token:", await response.text());
    return null;
  }
  return response.json();
}

async function refreshMicrosoftToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("MICROSOFT_CLIENT_ID")!,
      client_secret: Deno.env.get("MICROSOFT_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    console.error("Failed to refresh Microsoft token:", await response.text());
    return null;
  }
  return response.json();
}

async function getValidAccessToken(
  supabaseService: ReturnType<typeof createClient>,
  integration: { id: string; access_token: string; refresh_token: string; token_expires_at: string; provider: string }
): Promise<string | null> {
  const expiresAt = new Date(integration.token_expires_at);
  // Refresh if expiring within 5 minutes
  if (expiresAt.getTime() - Date.now() > 5 * 60 * 1000) {
    return integration.access_token;
  }

  const refreshFn = integration.provider === "google" ? refreshGoogleToken : refreshMicrosoftToken;
  const refreshed = await refreshFn(integration.refresh_token);
  if (!refreshed) return null;

  await supabaseService.from("user_integrations").update({
    access_token: refreshed.access_token,
    token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
  }).eq("id", integration.id);

  return refreshed.access_token;
}

// --- Base64url encoding for Gmail ---

function base64url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const b64 = base64Encode(bytes);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// --- Attachment fetching ---

interface Attachment {
  filename: string;
  content: Uint8Array;
  mimeType: string;
}

async function fetchAttachments(
  supabase: ReturnType<typeof createClient>,
  attachmentDocIds: string[]
): Promise<Attachment[]> {
  const attachments: Attachment[] = [];
  const { data: docs } = await supabase
    .from("documents")
    .select("id, name, file_path, file_type")
    .in("id", attachmentDocIds);

  if (!docs) return attachments;

  for (const doc of docs) {
    try {
      const { data: fileData, error } = await supabase.storage.from("documents").download(doc.file_path);
      if (error || !fileData) {
        console.error(`Failed to download ${doc.name}:`, error);
        continue;
      }
      const arrayBuffer = await fileData.arrayBuffer();
      attachments.push({
        filename: doc.name,
        content: new Uint8Array(arrayBuffer),
        mimeType: doc.file_type || "application/octet-stream",
      });
    } catch (err) {
      console.error(`Error processing attachment ${doc.name}:`, err);
    }
  }
  return attachments;
}

// --- Send via Gmail API ---

async function sendViaGmail(
  accessToken: string,
  from: string,
  fromName: string,
  toList: string[],
  subject: string,
  htmlBody: string,
  replyTo: string,
  attachments: Attachment[],
  bccList: string[] = []
): Promise<{ id: string }> {
  const boundary = `boundary_${crypto.randomUUID()}`;
  const toHeader = toList.join(", ");

  let rawMessage = "";
  if (attachments.length > 0) {
    rawMessage += `MIME-Version: 1.0\r\n`;
    rawMessage += `From: ${fromName} <${from}>\r\n`;
    rawMessage += `To: ${toHeader}\r\n`;
    if (bccList.length > 0) rawMessage += `Bcc: ${bccList.join(", ")}\r\n`;
    rawMessage += `Subject: ${subject}\r\n`;
    rawMessage += `Reply-To: ${replyTo}\r\n`;
    rawMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
    rawMessage += `--${boundary}\r\n`;
    rawMessage += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`;
    rawMessage += `${htmlBody}\r\n`;
    for (const att of attachments) {
      rawMessage += `--${boundary}\r\n`;
      rawMessage += `Content-Type: ${att.mimeType}; name="${att.filename}"\r\n`;
      rawMessage += `Content-Disposition: attachment; filename="${att.filename}"\r\n`;
      rawMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
      rawMessage += `${base64Encode(att.content)}\r\n`;
    }
    rawMessage += `--${boundary}--\r\n`;
  } else {
    rawMessage += `MIME-Version: 1.0\r\n`;
    rawMessage += `From: ${fromName} <${from}>\r\n`;
    rawMessage += `To: ${toHeader}\r\n`;
    if (bccList.length > 0) rawMessage += `Bcc: ${bccList.join(", ")}\r\n`;
    rawMessage += `Subject: ${subject}\r\n`;
    rawMessage += `Reply-To: ${replyTo}\r\n`;
    rawMessage += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`;
    rawMessage += htmlBody;
  }

  const encodedMessage = base64url(rawMessage);

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gmail API error (${response.status}): ${errText}`);
  }

  return response.json();
}

// --- Send via Microsoft Graph API ---

async function sendViaMicrosoft(
  accessToken: string,
  from: string,
  fromName: string,
  toList: string[],
  subject: string,
  htmlBody: string,
  replyTo: string,
  attachments: Attachment[],
  bccList: string[] = []
): Promise<void> {
  const toRecipients = toList.map((email) => ({
    emailAddress: { address: email },
  }));

  const bccRecipients = bccList.map((email) => ({
    emailAddress: { address: email },
  }));

  const payload: Record<string, unknown> = {
    message: {
      subject,
      body: { contentType: "HTML", content: htmlBody },
      toRecipients,
      bccRecipients,
      from: { emailAddress: { address: from, name: fromName } },
      replyTo: [{ emailAddress: { address: replyTo } }],
    },
    saveToSentItems: true,
  };

  if (attachments.length > 0) {
    (payload.message as Record<string, unknown>).attachments = attachments.map((att) => ({
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: att.filename,
      contentType: att.mimeType,
      contentBytes: base64Encode(att.content),
    }));
  }

  const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Microsoft Graph error (${response.status}): ${errText}`);
  }
}

// --- Send via Resend (fallback) ---

async function sendViaResend(
  fromName: string,
  toList: string[],
  subject: string,
  htmlBody: string,
  replyTo: string,
  attachments: Attachment[],
  bccList: string[] = []
): Promise<{ id: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

  const resendPayload: Record<string, unknown> = {
    from: `${fromName} <taslim@mungerlongview.com>`,
    to: toList,
    bcc: bccList,
    subject,
    html: htmlBody,
    reply_to: replyTo,
  };

  if (attachments.length > 0) {
    resendPayload.attachments = attachments.map((att) => ({
      filename: att.filename,
      content: base64Encode(att.content),
    }));
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(resendPayload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Resend failed");
  return data;
}

// --- Build HTML body ---

function buildHtmlBody(body: string, trackingPixelUrl?: string): string {
  const htmlBody = body
    .split("\n\n")
    .map((p: string) => `<p style="margin:0 0 1em 0;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  const trackingTag = trackingPixelUrl
    ? `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;width:1px;height:1px;border:0;" alt="" />`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; width:100%; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
<div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#222222; max-width:600px;">
${htmlBody}
</div>
${trackingTag}
</body>
</html>`;
}

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email as string;

    const { to, subject, body, reply_to, from_name, attachment_doc_ids } = await req.json();

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, company_name")
      .eq("user_id", userId)
      .maybeSingle();

  const senderName = from_name || profile?.display_name || profile?.company_name || "DealScope";
  const toList = Array.isArray(to) ? to : [to];
  const replyTo = reply_to || userEmail;

  // BCC the sender so outgoing emails appear in their inbox
  const bccList = [userEmail];

    // Build HTML with tracking pixel
    // We'll generate a tracking ID and embed the pixel
    const trackingId = crypto.randomUUID();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const trackingPixelUrl = `${supabaseUrl}/functions/v1/track-email-open?t=${trackingId}`;
    const html = buildHtmlBody(body, trackingPixelUrl);

    // Fetch attachments
    const attachments = attachment_doc_ids?.length
      ? await fetchAttachments(supabase, attachment_doc_ids)
      : [];

    // Service client to read tokens
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try Google integration first
    const { data: googleIntegration } = await supabaseService
      .from("user_integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "google")
      .eq("is_active", true)
      .maybeSingle();

    // Try Microsoft integration second
    const { data: microsoftIntegration } = await supabaseService
      .from("user_integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "microsoft")
      .eq("is_active", true)
      .maybeSingle();

    let externalId: string | null = null;
    let externalProvider: string;
    let senderEmail = userEmail;

    if (googleIntegration?.access_token && googleIntegration?.refresh_token) {
      // --- Gmail path ---
      const accessToken = await getValidAccessToken(supabaseService, googleIntegration);
      if (!accessToken) throw new Error("Failed to get valid Google access token");

      senderEmail = googleIntegration.email || userEmail;
      const result = await sendViaGmail(accessToken, senderEmail, senderName, toList, subject, html, replyTo, attachments, bccList);
      externalId = result.id;
      externalProvider = "google";
      console.log("Email sent via Gmail:", externalId);
    } else if (microsoftIntegration?.access_token && microsoftIntegration?.refresh_token) {
      // --- Microsoft path ---
      const accessToken = await getValidAccessToken(supabaseService, microsoftIntegration);
      if (!accessToken) throw new Error("Failed to get valid Microsoft access token");

      senderEmail = microsoftIntegration.email || userEmail;
      await sendViaMicrosoft(accessToken, senderEmail, senderName, toList, subject, html, replyTo, attachments, bccList);
      externalProvider = "microsoft";
      console.log("Email sent via Microsoft Graph");
    } else {
      // --- Resend fallback ---
      const result = await sendViaResend(senderName, toList, subject, html, replyTo, attachments, bccList);
      externalId = result.id;
      externalProvider = "resend";
      console.log("Email sent via Resend:", externalId);
    }

    // Save to database
    const { data: emailRecord, error: dbError } = await supabase.from("emails").insert({
      user_id: userId,
      subject,
      body_preview: body.substring(0, 500),
      from_email: senderEmail,
      from_name: senderName,
      to_emails: toList,
      received_at: new Date().toISOString(),
      is_read: true,
      direction: "outbound",
      external_id: externalId,
      external_provider: externalProvider,
      tracking_id: trackingId,
    }).select("id").single();

    if (dbError) console.error("DB save error:", dbError);

    // Save attachment references
    if (emailRecord && attachment_doc_ids?.length) {
      const attachmentRecords = attachment_doc_ids.map((docId: string) => ({
        email_id: emailRecord.id,
        document_id: docId,
      }));
      const { error: attachError } = await supabase.from("email_attachments").insert(attachmentRecords);
      if (attachError) console.error("Attachment save error:", attachError);
    }

    return new Response(
      JSON.stringify({ success: true, id: externalId, provider: externalProvider }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send email error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
