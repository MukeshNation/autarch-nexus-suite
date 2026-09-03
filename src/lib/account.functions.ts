import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EXPORT_TABLES = [
  "profiles",
  "workspaces",
  "projects",
  "tasks",
  "project_files",
  "ai_conversations",
  "ai_messages",
  "ai_generations",
  "credit_ledger",
  "usage_events",
  "notifications",
  "subscriptions",
] as const;

export const exportMyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const payload: Record<string, string> = {
      exported_at: JSON.stringify(new Date().toISOString()),
      user_id: JSON.stringify(context.userId),
    };
    for (const table of EXPORT_TABLES) {
      // RLS scopes every read to the signed-in user.
      const { data, error } = await context.supabase.from(table).select("*");
      payload[table] = JSON.stringify(error ? { error: error.message } : (data ?? []));
    }
    return { json: `{${Object.entries(payload).map(([k, v]) => `${JSON.stringify(k)}:${v}`).join(",")}}` };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
