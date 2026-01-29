import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let profileContext = "";
    
    if (authHeader && SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, company_name, fundraising_goal, currency")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (profile) {
          profileContext = `

**User Profile Context:**
- Name: ${profile.display_name || "Not set"}
- Company: ${profile.company_name || "Not set"}
- Fundraising Goal: ${profile.currency || "USD"} ${profile.fundraising_goal?.toLocaleString() || "Not set"}
- Email: ${user.email || "Not available"}

Use this context to personalize your responses when relevant.`;
        }
      }
    }

    const systemPrompt = `You are an intelligent AI assistant for DealScope, a Search Fund CRM platform. You help users with:

1. **Email Drafting**: Generate personalized outreach emails to investors, company owners, and intermediaries based on their profiles and deal context.

2. **Deal Analysis**: Score and analyze deals based on criteria like revenue, EBITDA, industry, geography, and attractiveness.

3. **Follow-up Suggestions**: Recommend optimal timing and content for follow-ups based on pipeline stage and interaction history.

4. **Meeting Summaries**: Generate summaries and action items from meeting notes.

5. **Pipeline Insights**: Provide insights about the deal pipeline, investor relationships, and outreach effectiveness.

Keep responses clear, actionable, and professional. When drafting emails, match the appropriate tone for the recipient type. For analysis, be specific and data-driven.${profileContext}`;

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
          ...messages,
        ],
        stream: true,
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
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
