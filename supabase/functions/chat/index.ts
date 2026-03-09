import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tools = [
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description: "Create a new calendar event / meeting for the user. Use this when the user asks to schedule or add a meeting, event, or appointment.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Title of the event" },
          start_time: { type: "string", description: "ISO 8601 start datetime, e.g. 2026-03-10T14:00:00" },
          end_time: { type: "string", description: "ISO 8601 end datetime, e.g. 2026-03-10T15:00:00" },
          description: { type: "string", description: "Optional description or notes" },
          location: { type: "string", description: "Optional location" },
          meeting_type: { type: "string", enum: ["video", "phone", "in_person", "google_meet"], description: "Optional meeting type" },
          meeting_link: { type: "string", description: "Optional meeting link URL" },
          all_day: { type: "boolean", description: "Whether this is an all-day event" },
        },
        required: ["title", "start_time", "end_time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task for the user. Use this when the user asks to add a task, reminder, or to-do item.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Title of the task" },
          description: { type: "string", description: "Optional description" },
          due_date: { type: "string", description: "Optional due date in YYYY-MM-DD format" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_note",
      description: "Create a new note for the user. Use this when the user asks to save or jot down a note.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Title of the note" },
          content: { type: "string", description: "Content of the note" },
        },
        required: ["title"],
      },
    },
  },
];

async function executeTool(
  toolName: string,
  args: Record<string, any>,
  supabase: any,
  userId: string,
): Promise<string> {
  try {
    if (toolName === "create_calendar_event") {
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          user_id: userId,
          title: args.title,
          start_time: args.start_time,
          end_time: args.end_time,
          description: args.description || null,
          location: args.location || null,
          meeting_type: args.meeting_type || null,
          meeting_link: args.meeting_link || null,
          all_day: args.all_day || false,
        })
        .select()
        .single();

      if (error) return JSON.stringify({ success: false, error: error.message });
      return JSON.stringify({ success: true, event: { id: data.id, title: data.title, start_time: data.start_time, end_time: data.end_time } });
    }

    if (toolName === "create_task") {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title: args.title,
          description: args.description || null,
          due_date: args.due_date || null,
          priority: args.priority || "medium",
        })
        .select()
        .single();

      if (error) return JSON.stringify({ success: false, error: error.message });
      return JSON.stringify({ success: true, task: { id: data.id, title: data.title } });
    }

    if (toolName === "create_note") {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: userId,
          title: args.title,
          content: args.content || null,
        })
        .select()
        .single();

      if (error) return JSON.stringify({ success: false, error: error.message });
      return JSON.stringify({ success: true, note: { id: data.id, title: data.title } });
    }

    return JSON.stringify({ success: false, error: "Unknown tool" });
  } catch (e) {
    return JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" });
  }
}

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    const { messages } = await req.json();

    // Fetch all data in parallel
    const [
      profileRes, investorsRes, companiesRes, contactsRes, dealsRes,
      tasksRes, emailsRes, calendarRes, notesRes, activitiesRes, updatesRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
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

    const investorsByStage: Record<string, number> = {};
    let totalCommitted = 0;
    investors.forEach((inv: any) => {
      investorsByStage[inv.stage] = (investorsByStage[inv.stage] || 0) + 1;
      if (['committed', 'closed'].includes(inv.stage) && inv.commitment_amount) {
        totalCommitted += Number(inv.commitment_amount);
      }
    });

    const dealsByStage: Record<string, number> = {};
    deals.forEach((d: any) => {
      dealsByStage[d.stage] = (dealsByStage[d.stage] || 0) + 1;
    });

    const overdueTasks = tasks.filter((t: any) => !t.completed && t.due_date && new Date(t.due_date) < new Date());
    const pendingTasks = tasks.filter((t: any) => !t.completed);

    const today = new Date().toISOString().split("T")[0];

    const dataContext = `

**Today's Date:** ${today}

**User Profile:**
- Name: ${profile?.display_name || "Not set"}
- Company: ${profile?.company_name || "Not set"}
- Fundraising Goal: ${profile?.currency || "USD"} ${profile?.fundraising_goal?.toLocaleString() || "Not set"}
- Email: ${userEmail || "N/A"}

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

    const systemPrompt = `You are an intelligent AI assistant for Acquire CRM, a platform built for acquisition entrepreneurs. You have FULL ACCESS to the user's data and can make decisions, suggestions, and draft content based on real data — the user does NOT need to give you information manually.

Your capabilities:
1. **Create Calendar Events**: When users ask to schedule meetings, events, or appointments, USE the create_calendar_event tool to actually create them. Always use the tool — don't just say you created it.
2. **Create Tasks**: When users ask to add tasks, reminders, or to-dos, USE the create_task tool.
3. **Create Notes**: When users ask to save notes, USE the create_note tool.
4. **Email Drafting**: Generate personalized outreach emails based on actual profiles and deal context.
5. **Deal Analysis**: Score and analyze deals based on real data.
6. **Follow-up Suggestions**: Recommend optimal timing and content for follow-ups.
7. **Meeting Summaries**: Generate summaries and action items from meeting notes.
8. **Pipeline Insights**: Provide insights about the deal pipeline and investor relationships.
9. **Task Recommendations**: Suggest tasks based on overdue items and stale relationships.
10. **Investor Updates**: Help draft monthly/quarterly investor updates using real metrics.

IMPORTANT RULES:
- When the user asks to create/schedule/add something (meeting, task, note), ALWAYS use the appropriate tool. Never just describe what you would do — actually do it.
- You already have the user's data below. Use it proactively.
- Keep responses clear, actionable, and professional.
- Today's date is provided in the context — use it for relative date references like "tomorrow", "next Monday", etc.
${dataContext}`;

    // Non-streaming tool-calling loop
    let aiMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const MAX_TOOL_ROUNDS = 5;
    let finalContent = "";

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
          tools,
          tool_choice: "auto",
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errorText = await aiResponse.text();
        console.error("AI gateway error:", aiResponse.status, errorText);
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await aiResponse.json();
      const choice = result.choices?.[0];

      if (!choice) {
        return new Response(JSON.stringify({ error: "No response from AI" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const assistantMessage = choice.message;
      aiMessages.push(assistantMessage);

      // If no tool calls, we have the final answer
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        finalContent = assistantMessage.content || "";
        break;
      }

      // Execute tool calls
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        let toolArgs: Record<string, any> = {};
        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          toolArgs = {};
        }

        console.log(`Executing tool: ${toolName}`, toolArgs);
        const toolResult = await executeTool(toolName, toolArgs, supabase, userId);
        console.log(`Tool result: ${toolResult}`);

        aiMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }
    }

    // Return the final text response as a simple JSON (non-streaming since we need tool calling)
    return new Response(JSON.stringify({ content: finalContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
