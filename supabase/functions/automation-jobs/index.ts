import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const results: string[] = [];

    // 1. Auto-lock stale rooms (not confirmed in 24h)
    const { error: lockErr } = await supabase.rpc("auto_lock_stale_rooms");
    results.push(lockErr ? `stale_rooms: ${lockErr.message}` : "stale_rooms: done");

    // 2. Recalculate all lead scores
    const { error: scoreErr } = await supabase.rpc("recalculate_all_lead_scores");
    results.push(scoreErr ? `lead_scores: ${scoreErr.message}` : "lead_scores: done");

    // 3. Create overdue follow-up notifications
    const { error: notifErr } = await supabase.rpc("create_overdue_notifications");
    results.push(notifErr ? `overdue_notifs: ${notifErr.message}` : "overdue_notifs: done");

    // 4. Expire stale soft locks
    const { error: lockExpErr } = await supabase
      .from("soft_locks")
      .update({ is_active: false })
      .eq("is_active", true)
      .lt("expires_at", new Date().toISOString());
    results.push(lockExpErr ? `expire_locks: ${lockExpErr.message}` : "expire_locks: done");

    console.log("Automation results:", results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("automation-jobs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
