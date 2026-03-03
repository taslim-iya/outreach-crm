import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const entityTypeHint = formData.get("entity_type") as string | null;

    if (!file) throw new Error("No file provided");

    let rawText = "";
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) {
      rawText = await file.text();
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
      const sheets: string[] = [];
      for (const name of workbook.SheetNames) {
        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name]);
        if (csv.trim()) sheets.push(`--- Sheet: ${name} ---\n${csv}`);
      }
      rawText = sheets.join("\n\n");
      if (rawText.length > 400000) rawText = rawText.substring(0, 400000);
    } else if (fileName.endsWith(".pdf")) {
      // For PDF, extract printable text as best-effort
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const decoder = new TextDecoder("utf-8", { fatal: false });
      let decoded = decoder.decode(bytes);
      // Extract text between BT/ET markers (PDF text objects)
      const textParts: string[] = [];
      const btRegex = /BT\s([\s\S]*?)ET/g;
      let match;
      while ((match = btRegex.exec(decoded)) !== null) {
        const block = match[1];
        // Extract text from Tj and TJ operators
        const tjRegex = /\(([^)]*)\)\s*Tj/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(block)) !== null) {
          textParts.push(tjMatch[1]);
        }
        // TJ arrays
        const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
        let arrMatch;
        while ((arrMatch = tjArrayRegex.exec(block)) !== null) {
          const inner = arrMatch[1];
          const strRegex = /\(([^)]*)\)/g;
          let sMatch;
          while ((sMatch = strRegex.exec(inner)) !== null) {
            textParts.push(sMatch[1]);
          }
        }
      }
      if (textParts.length > 0) {
        rawText = textParts.join(" ");
      } else {
        // Fallback: extract printable strings
        decoded = decoded.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, " | ");
        rawText = decoded;
      }
      if (rawText.length > 400000) rawText = rawText.substring(0, 400000);
    } else {
      rawText = await file.text();
    }

    if (!rawText.trim()) {
      throw new Error("Could not extract text from file. For Excel files, make sure data is in the first sheet. For PDFs, try saving as CSV first.");
    }

    // Build a prompt that auto-detects entity type if not specified, or uses the hint
    const entityTypeInstruction = entityTypeHint && entityTypeHint !== "auto"
      ? `The data should be parsed as "${entityTypeHint}".`
      : `First, analyze the data and determine what type of records these are. The possible types are:
- "companies" — business/company records with fields like company name, industry, geography, revenue, etc.
- "contacts" — people/person records with fields like person name, email, phone, organization, role, etc. Contact types include: investor, owner, intermediary, advisor, river_guide, operator, other.
- "deals" — deal/transaction records with fields like deal name, stage, source, company, etc.

Choose the best matching type based on the columns/content.`;

    const systemPrompt = `You are a data extraction AI. You MUST extract ALL records from the data — up to 200 records. Do NOT truncate, summarize, or stop early. Extract every single row. ${entityTypeInstruction}

Based on the detected (or specified) type, extract records into a JSON object with this structure:
{
  "entity_type": "companies" | "contacts" | "deals",
  "records": [...]
}

Field schemas by type:

**companies**: name (required), industry, geography, website, description, sic_code, naics_code, ownership_type (private/family-owned/pe-backed/public/founder-led/estate/unknown), revenue_band (<$1M/$1-5M/$5-10M/$10-25M/$25-50M/$50-100M/$100M+), ebitda_band (<$500K/$500K-1M/$1-3M/$3-5M/$5-10M/$10M+), employee_count (number), company_status (prospect/researching/contacted/engaged/passed/archived), company_source, company_tags (array)

**contacts**: name (required), email, phone, organization, role, geography, source, contact_type (investor/owner/intermediary/advisor/river_guide/operator/other), tags (array), notes

**deals**: name (required), source (proprietary/brokered/inbound), stage (screening/contacted/teaser/cim/ioi/loi/dd/financing/signing/closed_won/lost), notes

Use null for missing fields. Infer values where reasonable (e.g., map revenue numbers to the closest band). Return ONLY valid JSON, no markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 65000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse the following document and extract ALL records (every single row, up to 200). Do not stop early or truncate:\n\n${rawText}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("AI parsing failed");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "{}";
    
    let parsed;
    try {
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI returned invalid format. Try a cleaner file.");
    }

    // Handle both old format (array) and new format (object with entity_type)
    let records: any[];
    let detectedType: string;
    
    if (Array.isArray(parsed)) {
      records = parsed;
      detectedType = entityTypeHint || "companies";
    } else {
      records = parsed.records || [];
      detectedType = parsed.entity_type || entityTypeHint || "companies";
    }

    if (!Array.isArray(records)) records = [records];

    return new Response(JSON.stringify({ 
      records, 
      count: records.length, 
      entity_type: detectedType 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-import error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
