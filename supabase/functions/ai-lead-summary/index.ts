import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lead, conversations, visits, bookings } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are an expert PG/hostel sales analyst. Analyze this lead and provide a concise summary.

LEAD DATA:
Name: ${lead.name}
Phone: ${lead.phone}
Status: ${lead.status}
Source: ${lead.source}
Budget: ${lead.budget || 'Not specified'}
Location: ${lead.preferred_location || 'Not specified'}
Score: ${lead.lead_score}/100
Created: ${lead.created_at}
Last Activity: ${lead.last_activity_at}
Response Time: ${lead.first_response_time_min || 'N/A'} min
Agent: ${lead.agent_name || 'Unassigned'}

RECENT MESSAGES (${conversations?.length || 0}):
${(conversations || []).slice(0, 5).map((c: any) => `[${c.direction}] ${c.message}`).join('\n')}

VISITS (${visits?.length || 0}):
${(visits || []).map((v: any) => `${v.property_name} - ${v.outcome || 'pending'}`).join('\n')}

BOOKINGS (${bookings?.length || 0}):
${(bookings || []).map((b: any) => `${b.property_name} - ${b.booking_status} - ₹${b.monthly_rent || '?'}`).join('\n')}

Return a JSON response with these exact fields:
- intent: One sentence about what the lead wants (max 15 words)
- urgency: "hot" | "warm" | "cold" with one-line reason
- next_action: Specific recommended next action for the sales agent (max 20 words)
- risk: One potential risk or objection (max 15 words)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a PG booking sales intelligence assistant. Always respond with valid JSON only, no markdown." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "lead_summary",
            description: "Return lead analysis summary",
            parameters: {
              type: "object",
              properties: {
                intent: { type: "string" },
                urgency: { type: "string", enum: ["hot", "warm", "cold"] },
                urgency_reason: { type: "string" },
                next_action: { type: "string" },
                risk: { type: "string" },
              },
              required: ["intent", "urgency", "urgency_reason", "next_action", "risk"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "lead_summary" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    const summary = toolCall ? JSON.parse(toolCall.function.arguments) : { intent: "Unable to analyze", urgency: "cold", urgency_reason: "Insufficient data", next_action: "Gather more information", risk: "Unknown" };

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-lead-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
