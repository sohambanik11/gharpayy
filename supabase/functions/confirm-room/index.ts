import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { room_id, status, rent, confirmed_by } = await req.json();

    if (!room_id || !status) {
      return new Response(JSON.stringify({ error: "room_id and status required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Insert room status confirmation (triggers on_room_status_confirm)
    const { error: logErr } = await supabase.from("room_status_log").insert({
      room_id,
      status,
      confirmed_by: confirmed_by || null,
      rent_updated: !!rent,
      notes: rent ? `Rent updated to ₹${rent}` : null,
    });

    if (logErr) throw logErr;

    // Update rent if provided
    if (rent) {
      await supabase.from("rooms").update({ expected_rent: rent }).eq("id", room_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("confirm-room error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
