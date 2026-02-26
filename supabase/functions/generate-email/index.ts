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

    const { investorId, companyId, dealId, templateId, customInstructions } = await req.json();

    // Build context based on entity type
    let entityContext = "";
    let emailPurpose = "investor outreach";

    // Fetch investor details
    if (investorId) {
      const { data: investor } = await supabase
        .from("investor_deals")
        .select("name, organization, stage, notes, commitment_amount, contact_id")
        .eq("id", investorId)
        .single();

      if (investor) {
        let contactInfo = "";
        if (investor.contact_id) {
          const { data: contact } = await supabase
            .from("contacts")
            .select("email, name, role, organization")
            .eq("id", investor.contact_id)
            .single();
          if (contact) {
            contactInfo += `\n- Contact Name: ${contact.name}`;
            contactInfo += `\n- Contact Role: ${contact.role || "N/A"}`;
            contactInfo += `\n- Contact Organization: ${contact.organization || "N/A"}`;
            contactInfo += `\n- Email: ${contact.email || "Not available"}`;
          }
        }

        entityContext = `**Investor Details:**
- Name: ${investor.name}
- Organization: ${investor.organization || "N/A"}
- Current Stage: ${investor.stage}
- Notes: ${investor.notes || "None"}
- Commitment: ${investor.commitment_amount ? `$${investor.commitment_amount.toLocaleString()}` : "None yet"}${contactInfo}`;
        emailPurpose = "investor outreach / fundraising";
      }
    }

    // Fetch company details (Target Universe)
    if (companyId) {
      const { data: company } = await supabase
        .from("companies")
        .select("name, industry, geography, website, description, ownership_type, revenue_band, ebitda_band, employee_count, company_status, company_source, stage, notes, contact_id")
        .eq("id", companyId)
        .single();

      if (company) {
        let contactInfo = "";
        if (company.contact_id) {
          const { data: contact } = await supabase
            .from("contacts")
            .select("email, name, role, organization")
            .eq("id", company.contact_id)
            .single();
          if (contact) {
            contactInfo += `\n- Primary Contact: ${contact.name}`;
            contactInfo += `\n- Contact Role: ${contact.role || "N/A"}`;
            contactInfo += `\n- Contact Email: ${contact.email || "Not available"}`;
          }
        }

        entityContext = `**Target Company Details:**
- Company Name: ${company.name}
- Industry: ${company.industry || "N/A"}
- Geography: ${company.geography || "N/A"}
- Website: ${company.website || "N/A"}
- Description: ${company.description || "N/A"}
- Ownership: ${company.ownership_type || "N/A"}
- Revenue Band: ${company.revenue_band || "N/A"}
- EBITDA Band: ${company.ebitda_band || "N/A"}
- Employee Count: ${company.employee_count || "N/A"}
- Status: ${company.company_status || "N/A"}
- Source: ${company.company_source || "N/A"}
- Stage: ${company.stage}
- Notes: ${company.notes || "None"}${contactInfo}`;
        emailPurpose = "acquisition outreach / deal sourcing";
      }
    }

    // Fetch deal details (Deal Pipeline)
    if (dealId) {
      const { data: deal } = await supabase
        .from("deals")
        .select("name, stage, source, probability, expected_close_date, deal_revenue, deal_ebitda, notes, next_step, company_id, broker_id")
        .eq("id", dealId)
        .single();

      if (deal) {
        let companyInfo = "";
        if (deal.company_id) {
          const { data: linkedCompany } = await supabase
            .from("companies")
            .select("name, industry, geography, website, description, contact_id")
            .eq("id", deal.company_id)
            .single();
          if (linkedCompany) {
            companyInfo += `\n- Linked Company: ${linkedCompany.name}`;
            companyInfo += `\n- Industry: ${linkedCompany.industry || "N/A"}`;
            companyInfo += `\n- Geography: ${linkedCompany.geography || "N/A"}`;
            companyInfo += `\n- Website: ${linkedCompany.website || "N/A"}`;
            if (linkedCompany.contact_id) {
              const { data: contact } = await supabase
                .from("contacts")
                .select("email, name, role")
                .eq("id", linkedCompany.contact_id)
                .single();
              if (contact) {
                companyInfo += `\n- Company Contact: ${contact.name} (${contact.role || "N/A"})`;
                companyInfo += `\n- Contact Email: ${contact.email || "Not available"}`;
              }
            }
          }
        }

        let brokerInfo = "";
        if (deal.broker_id) {
          const { data: broker } = await supabase
            .from("brokers")
            .select("firm, contact_name, email")
            .eq("id", deal.broker_id)
            .single();
          if (broker) {
            brokerInfo = `\n- Broker: ${broker.contact_name} at ${broker.firm}`;
            brokerInfo += `\n- Broker Email: ${broker.email || "Not available"}`;
          }
        }

        entityContext = `**Deal Pipeline Details:**
- Deal Name: ${deal.name}
- Stage: ${deal.stage}
- Source: ${deal.source || "N/A"}
- Probability: ${deal.probability != null ? `${deal.probability}%` : "N/A"}
- Expected Close: ${deal.expected_close_date || "N/A"}
- Revenue: ${deal.deal_revenue ? `$${Number(deal.deal_revenue).toLocaleString()}` : "N/A"}
- EBITDA: ${deal.deal_ebitda ? `$${Number(deal.deal_ebitda).toLocaleString()}` : "N/A"}
- Next Step: ${deal.next_step || "N/A"}
- Notes: ${deal.notes || "None"}${companyInfo}${brokerInfo}`;
        emailPurpose = "deal-related outreach / acquisition communication";
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

    // Fetch ALL user templates for writing style learning
    const { data: allTemplates } = await supabase
      .from("email_templates")
      .select("name, subject, body, category")
      .order("created_at", { ascending: false })
      .limit(20);

    const styleContext = allTemplates && allTemplates.length > 0
      ? `**User's Saved Email Templates (learn the writing style, tone, and patterns from these):**\n${allTemplates.map((t, i) => `Template ${i + 1} - "${t.name}" (${t.category}):\nSubject: ${t.subject}\nBody: ${t.body}`).join("\n\n")}`
      : "";

    const systemPrompt = `You are an AI email composer for DealScope, a Search Fund CRM. Generate a professional, personalized email for ${emailPurpose}.

${profileContext}

${entityContext}

${templateContext}

${styleContext}

${docsContext}

${customInstructions ? `**User Instructions:** ${customInstructions}` : ""}

IMPORTANT: You MUST respond with a valid JSON object (no markdown code fences) with these fields:
{
  "subject": "Email subject line",
  "body": "Full email body in PLAIN TEXT only. No HTML tags like <p>, <br>, <strong>, <em>, etc. Use line breaks for paragraphs. Address the recipient by their first name naturally.",
  "suggested_documents": ["document_id_1", "document_id_2"],
  "reasoning": "Brief explanation of why you chose this approach and these documents"
}

CRITICAL STYLE INSTRUCTIONS:
- The body must be plain text only — NO HTML tags whatsoever.
- Use the recipient's actual name directly in the email greeting and body. Do not use placeholders like {{name}}.
- Study the user's saved templates above carefully. Match their writing tone, vocabulary, greeting style, sign-off style, and overall communication approach.
- If the user tends to be formal, be formal. If casual, be casual. Mirror their voice.
- When a base template is provided, stick closely to its structure and content. Only personalize the name and relevant details. Do NOT invent or add new information like specific dollar amounts, metrics, or claims that are not in the template. Keep the template's message intact.
- Do NOT pull fundraising goal amounts or other profile data into the email unless the template or custom instructions explicitly mention them.
- For deal sourcing / acquisition outreach: Focus on expressing interest in the company, requesting an introductory call, and demonstrating relevant background. Be respectful and professional.
- For deal pipeline outreach: Tailor the email to the current deal stage — early stages should be exploratory, later stages more direct about next steps.

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
        subject: "Outreach",
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
