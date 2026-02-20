import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
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
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch user profile for display name
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, company_name")
      .eq("user_id", userId)
      .maybeSingle();

    const senderName = from_name || profile?.display_name || profile?.company_name || "DealScope";

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build attachments from document IDs
    const attachments: { filename: string; content: string }[] = [];
    if (attachment_doc_ids && attachment_doc_ids.length > 0) {
      // Fetch document metadata
      const { data: docs } = await supabase
        .from("documents")
        .select("id, name, file_path, file_type")
        .in("id", attachment_doc_ids);

      if (docs) {
        for (const doc of docs) {
          try {
            const { data: fileData, error: downloadError } = await supabase
              .storage
              .from("documents")
              .download(doc.file_path);

            if (downloadError || !fileData) {
              console.error(`Failed to download ${doc.name}:`, downloadError);
              continue;
            }

            const arrayBuffer = await fileData.arrayBuffer();
            const base64Content = base64Encode(new Uint8Array(arrayBuffer));

            attachments.push({
              filename: doc.name,
              content: base64Content,
            });
          } catch (err) {
            console.error(`Error processing attachment ${doc.name}:`, err);
          }
        }
      }
    }

    // Build HTML that matches Gmail/Outlook default styling
    const htmlBody = body
      .split("\n\n")
      .map((p: string) => `<p style="margin:0 0 1em 0;">${p.replace(/\n/g, "<br>")}</p>`)
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; width:100%; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
<div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#222222; max-width:600px;">
${htmlBody}
</div>
</body>
</html>`;

    // Send via Resend
    const toList = Array.isArray(to) ? to : [to];
    const resendPayload: Record<string, unknown> = {
      from: `${senderName} <onboarding@resend.dev>`,
      to: toList,
      cc: toList.includes(userEmail) ? undefined : [userEmail],
      subject,
      html,
      reply_to: reply_to || userEmail,
    };

    if (attachments.length > 0) {
      resendPayload.attachments = attachments;
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      return new Response(
        JSON.stringify({
          error: resendData.message || "Failed to send email",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Save sent email to database
    const { data: emailRecord, error: dbError } = await supabase.from("emails").insert({
      user_id: userId,
      subject,
      body_preview: body.substring(0, 500),
      from_email: userEmail,
      from_name: senderName,
      to_emails: Array.isArray(to) ? to : [to],
      received_at: new Date().toISOString(),
      is_read: true,
      direction: "outbound",
      external_id: resendData.id,
      external_provider: "resend",
    }).select("id").single();

    if (dbError) {
      console.error("DB save error:", dbError);
    }

    // Save attachment references
    if (emailRecord && attachment_doc_ids && attachment_doc_ids.length > 0) {
      const attachmentRecords = attachment_doc_ids.map((docId: string) => ({
        email_id: emailRecord.id,
        document_id: docId,
      }));
      const { error: attachError } = await supabase
        .from("email_attachments")
        .insert(attachmentRecords);
      if (attachError) {
        console.error("Attachment save error:", attachError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Send email error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
