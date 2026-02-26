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

    // Get user from auth header and fetch ALL data for context
    const authHeader = req.headers.get("Authorization");
    let dataContext = "";
    
    if (authHeader && SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch all data in parallel
        const [
          profileRes,
          investorsRes,
          companiesRes,
          contactsRes,
          dealsRes,
          tasksRes,
          emailsRes,
          calendarRes,
          notesRes,
          activitiesRes,
          updatesRes,
        ] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("investor_deals").select("*").order("updated_at", { ascending: false }).limit(50),
          supabase.from("companies").select("*").order("updated_at", { ascending: false }).limit(50),
          supabase.from("contacts").select("*").order("updated_at", { ascending: false }).limit(50),
          supabase.from("deals").select("*").order("updated_at", { ascending: false }).limit(50),
          supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(30),
          supabase.from("emails").select("id, subject, from_email, from_name, to_emails, direction, send_status, received_at, open_count, body_preview").order("received_at", { ascending: false }).limit(30),
          supabase.from("calendar_events").select("*").gte("start_time", new Date().toISOString()).order("start_time", { ascending: true }).limit(20),
          supabase.from("notes").select("*").order("updated_at", { ascending: false }).limit(20),
          supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(20),
          supabase.from("investor_updates").select("*").order("created_at", { ascending: false }).limit(10),
        ]);

        const profile = profileRes.data;
        const investors = investorsRes.data || [];
        const companies = companiesRes.data || [];
        const contacts = contactsRes.data || [];
        const deals = dealsRes.data || [];
        const tasks = tasksRes.data || [];
        const emails = emailsRes.data || [];
        const calendar = calendarRes.data || [];
        const notes = notesRes.data || [];
        const activities = activitiesRes.data || [];
        const updates = updatesRes.data || [];

        // Build investor pipeline summary
        const investorsByStage: Record<string, number> = {};
        let totalCommitted = 0;
        investors.forEach((inv: any) => {
          investorsByStage[inv.stage] = (investorsByStage[inv.stage] || 0) + 1;
          if (['committed', 'closed'].includes(inv.stage) && inv.commitment_amount) {
            totalCommitted += Number(inv.commitment_amount);
          }
        });

        // Build deal pipeline summary
        const dealsByStage: Record<string, number> = {};
        deals.forEach((d: any) => {
          dealsByStage[d.stage] = (dealsByStage[d.stage] || 0) + 1;
        });

        // Build task summary
        const overdueTasks = tasks.filter((t: any) => !t.completed && t.due_date && new Date(t.due_date) < new Date());
        const pendingTasks = tasks.filter((t: any) => !t.completed);

        dataContext = `

**User Profile:**
- Name: ${profile?.display_name || "Not set"}
- Company: ${profile?.company_name || "Not set"}
- Fundraising Goal: ${profile?.currency || "USD"} ${profile?.fundraising_goal?.toLocaleString() || "Not set"}
- Email: ${user.email || "N/A"}

**Investor Pipeline (${investors.length} total):**
${Object.entries(investorsByStage).map(([stage, count]) => `- ${stage}: ${count}`).join("\n")}
- Total Committed: $${totalCommitted.toLocaleString()}
${investors.length > 0 ? `\nRecent investors:\n${investors.slice(0, 10).map((i: any) => `- ${i.name} (${i.organization || 'N/A'}) — Stage: ${i.stage}${i.commitment_amount ? `, Committed: $${Number(i.commitment_amount).toLocaleString()}` : ''}`).join("\n")}` : ""}

**Deal Sourcing Pipeline (${deals.length} total):**
${Object.entries(dealsByStage).map(([stage, count]) => `- ${stage}: ${count}`).join("\n")}
${deals.length > 0 ? `\nRecent deals:\n${deals.slice(0, 10).map((d: any) => `- ${d.name} — Stage: ${d.stage}${d.deal_revenue ? `, Revenue: $${Number(d.deal_revenue).toLocaleString()}` : ''}${d.deal_ebitda ? `, EBITDA: $${Number(d.deal_ebitda).toLocaleString()}` : ''}`).join("\n")}` : ""}

**Companies (${companies.length} total):**
${companies.slice(0, 10).map((c: any) => `- ${c.name} (${c.industry || 'N/A'}, ${c.geography || 'N/A'}) — Stage: ${c.stage}${c.revenue ? `, Rev: $${Number(c.revenue).toLocaleString()}` : ''}`).join("\n") || "None"}

**Contacts (${contacts.length} total):**
${contacts.slice(0, 10).map((c: any) => `- ${c.name} (${c.contact_type}, ${c.organization || 'N/A'}) — Warmth: ${c.warmth || 'N/A'}`).join("\n") || "None"}

**Tasks (${pendingTasks.length} pending, ${overdueTasks.length} overdue):**
${pendingTasks.slice(0, 10).map((t: any) => `- ${t.title} — Priority: ${t.priority || 'medium'}${t.due_date ? `, Due: ${t.due_date}` : ''}${overdueTasks.some((o: any) => o.id === t.id) ? ' ⚠️ OVERDUE' : ''}`).join("\n") || "None"}

**Recent Emails (${emails.length} shown):**
${emails.slice(0, 10).map((e: any) => `- ${e.direction === 'outbound' ? 'Sent to' : 'From'}: ${e.direction === 'outbound' ? e.to_emails?.[0] : e.from_name || e.from_email} — "${e.subject || '(no subject)'}"${e.open_count > 0 ? ` (opened ${e.open_count}x)` : ''}`).join("\n") || "None"}

**Upcoming Calendar Events:**
${calendar.slice(0, 10).map((ev: any) => `- ${ev.title} — ${new Date(ev.start_time).toLocaleDateString()} ${ev.meeting_type ? `(${ev.meeting_type})` : ''}`).join("\n") || "None upcoming"}

**Recent Notes:**
${notes.slice(0, 5).map((n: any) => `- "${n.title}"${n.content ? `: ${n.content.slice(0, 100)}...` : ''}`).join("\n") || "None"}

**Recent Activity:**
${activities.slice(0, 10).map((a: any) => `- ${a.activity_type}: ${a.title}`).join("\n") || "None"}

**Investor Updates Sent:** ${updates.filter((u: any) => u.status === 'sent').length} sent, ${updates.filter((u: any) => u.status === 'draft').length} drafts
`;
      }
    }

    const systemPrompt = `You are an intelligent AI assistant for Acquire CRM, a platform built for acquisition entrepreneurs. You have FULL ACCESS to the user's data and can make decisions, suggestions, and draft content based on real data — the user does NOT need to give you information manually.

Your capabilities:
1. **Email Drafting**: Generate personalized outreach emails to investors, company owners, and intermediaries based on their actual profiles and deal context.
2. **Deal Analysis**: Score and analyze deals based on real data — revenue, EBITDA, industry, geography, and attractiveness.
3. **Follow-up Suggestions**: Recommend optimal timing and content for follow-ups based on pipeline stage and interaction history.
4. **Meeting Summaries**: Generate summaries and action items from meeting notes.
5. **Pipeline Insights**: Provide insights about the deal pipeline, investor relationships, and outreach effectiveness.
6. **Task Recommendations**: Suggest tasks based on overdue items, stale relationships, and upcoming deadlines.
7. **Investor Updates**: Help draft monthly/quarterly investor updates using real metrics.

Keep responses clear, actionable, and professional. When drafting emails, match the appropriate tone for the recipient type. For analysis, be specific and data-driven. Reference actual data from the user's CRM whenever relevant.

IMPORTANT: You already have the user's data below. Use it proactively — don't ask the user for information you already have.${dataContext}`;

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
