import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { investorId, templateId, customInstructions } = await req.json();

    // Fetch investor details
    let investorContext = "";
    if (investorId) {
      const { data: investor } = await supabase
        .from("investor_deals")
        .select("name, organization, stage, notes, commitment_amount, contact_id")
        .eq("id", investorId)
        .single();

      if (investor) {
        // Try to get contact email
        let contactEmail = "";
        if (investor.contact_id) {
          const { data: contact } = await supabase
            .from("contacts")
            .select("email, name, role, organization")
            .eq("id", investor.contact_id)
            .single();
          if (contact) {
            contactEmail = contact.email || "";
            investorContext += `\n- Contact Name: ${contact.name}`;
            investorContext += `\n- Contact Role: ${contact.role || "N/A"}`;
            investorContext += `\n- Contact Organization: ${contact.organization || "N/A"}`;
          }
        }

        investorContext = `**Investor Details:**
- Name: ${investor.name}
- Organization: ${investor.organization || "N/A"}
- Current Stage: ${investor.stage}
- Notes: ${investor.notes || "None"}
- Commitment: ${investor.commitment_amount ? `$${investor.commitment_amount.toLocaleString()}` : "None yet"}${investorContext}
- Email: ${contactEmail || "Not available"}`;
      }
    }

    // Fetch template if provided
    let templateContext = "";
    if (templateId) {
      const { data: template } = await supabase
        .from("email_templates")
        .select("name, subject, body, category")
        .eq("id", templateId)
        .single();

      if (template) {
        templateContext = `**Email Template to base this on:**
- Template Name: ${template.name}
- Subject Line: ${template.subject}
- Body: ${template.body}
- Category: ${template.category}`;
      }
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, company_name, fundraising_goal, currency")
      .eq("user_id", user.id)
      .maybeSingle();

    const profileContext = profile
      ? `**Sender Profile:**
- Name: ${profile.display_name || "Not set"}
- Company: ${profile.company_name || "Not set"}
- Fundraising Goal: ${profile.currency || "USD"} ${profile.fundraising_goal?.toLocaleString() || "Not set"}`
      : "";

    // Fetch user's documents for context
    const { data: documents } = await supabase
      .from("documents")
      .select("id, name, document_type")
      .order("created_at", { ascending: false })
      .limit(50);

    const docsContext = documents && documents.length > 0
      ? `**Available Documents (user can attach these):**\n${documents.map(d => `- [${d.id}] ${d.name} (${d.document_type})`).join("\n")}`
      : "";

    const systemPrompt = `You are an AI email composer for DealScope, a Search Fund CRM. Generate a professional, personalized email for investor outreach.

${profileContext}

${investorContext}

${templateContext}

${docsContext}

${customInstructions ? `**User Instructions:** ${customInstructions}` : ""}

IMPORTANT: You MUST respond with a valid JSON object (no markdown code fences) with these fields:
{
  "subject": "Email subject line",
  "body": "Full email body in PLAIN TEXT only. No HTML tags like <p>, <br>, <strong>, <em>, etc. Use line breaks for paragraphs. Address the investor by their first name naturally.",
  "suggested_documents": ["document_id_1", "document_id_2"],
  "reasoning": "Brief explanation of why you chose this approach and these documents"
}

CRITICAL: The body must be plain text only — NO HTML tags whatsoever. Use the investor's actual name directly in the email greeting and body. Do not use placeholders like {{name}}.

For suggested_documents, analyze the email content and suggest relevant documents from the available documents list. For example:
- If discussing a deal, suggest the relevant pitch deck or CIM
- If following up after NDA, suggest NDA documents
- If requesting a meeting, suggest an executive summary
Only include document IDs from the available documents list above. If no documents are relevant, return an empty array.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate the email now." },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content from AI");
    }

    // Parse the JSON response, handling possible markdown code fences
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parsing fails, return the raw content
      parsed = {
        subject: "Investor Outreach",
        body: content,
        suggested_documents: [],
        reasoning: "AI returned non-structured response",
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
