// Deletes the calling user's account entirely — required by App Store
// Review Guideline 5.1.1(v) for any app with account creation.
//
// Runs server-side only: the service role key needed to delete an
// auth.users row can never be shipped in the client bundle. This function
// is the one place it's used, and only after independently verifying (via
// the caller's own JWT, not anything the client claims) which user is
// making the request.
//
// Every table in the schema (tasks, captures, boards, vision_items,
// goals, milestones, finance_*, cleared_days, profiles) has
// `user_id uuid references auth.users(id) on delete cascade` — see
// supabase/migrations/0001_init.sql. So deleting the auth.users row is
// enough on its own: Postgres cascades the deletion through every one of
// those tables in the same transaction. There's no separate per-table
// cleanup to keep in sync as the schema grows.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonResponse = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Scoped to the caller's own JWT — used only to find out who's asking.
    // Never trust a user id passed in the request body for a delete like this.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Not authenticated" }, 401);
    }

    // Service-role client — the only client in this codebase allowed to
    // hold this key, and only because it's an Edge Function env var, never
    // bundled into the app.
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return jsonResponse({ error: deleteError.message }, 500);
    }

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
