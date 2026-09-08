/**
 * AUTARCH AI — owner/admin control plane (server functions).
 * Every function verifies a staff role server-side. Secrets are written with the
 * service role and never returned to the browser.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CAPABILITIES, MODULE_MANIFEST, IMPLEMENTED_ADAPTERS } from "./capabilities";

async function assertStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (error || data !== true) throw new Error("Forbidden");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function audit(userId: string, action: string, metadata: Record<string, unknown>) {
  const db = await admin();
  await db.from("audit_logs").insert({ user_id: userId, action, metadata } as never);
}

/* ------------------------------------------------------------------ providers */

export type AdminProvider = {
  id: string;
  name: string;
  category: string;
  adapter: string;
  base_url: string | null;
  model: string | null;
  capabilities: string[];
  enabled: boolean;
  priority: number;
  timeout_ms: number;
  notes: string | null;
  has_secret: boolean;
  secret_masked: string;
  last_test_status: string | null;
  last_test_at: string | null;
};

export const listProviders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ providers: AdminProvider[]; routes: Record<string, { primary: string | null; fallback: string | null }> }> => {
    await assertStaff(context as never);
    const db = await admin();
    const { data } = await db.from("ai_providers").select("*").order("created_at", { ascending: true });
    const { data: routes } = await db.from("capability_routes").select("*");
    const map: Record<string, { primary: string | null; fallback: string | null }> = {};
    for (const c of CAPABILITIES) map[c] = { primary: null, fallback: null };
    for (const r of routes ?? []) {
      map[r.capability] = { primary: r.primary_provider_id, fallback: r.fallback_provider_id };
    }
    return {
      providers: (data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        adapter: p.adapter,
        base_url: p.base_url,
        model: p.model,
        capabilities: p.capabilities ?? [],
        enabled: p.enabled,
        priority: p.priority,
        timeout_ms: p.timeout_ms,
        notes: p.notes,
        has_secret: p.has_secret,
        secret_masked: p.has_secret ? "•••• stored server-side" : "not set",
        last_test_status: p.last_test_status,
        last_test_at: p.last_test_at,
      })),
      routes: map,
    };
  });

const ProviderInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(80),
  category: z.string().min(1).max(40),
  adapter: z.string().min(1).max(40),
  base_url: z.string().url().max(300),
  model: z.string().min(1).max(120),
  capabilities: z.array(z.enum(CAPABILITIES)).min(1),
  enabled: z.boolean(),
  priority: z.number().int().min(1).max(1000),
  timeout_ms: z.number().int().min(1000).max(180000),
  notes: z.string().max(500).nullable().optional(),
  api_key: z.string().min(8).max(400).optional(),
});

export const saveProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProviderInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    if (!IMPLEMENTED_ADAPTERS.includes(data.adapter)) {
      throw new Error("NEW ADAPTER REQUIRED — this provider protocol is not supported yet.");
    }
    const db = await admin();
    const row = {
      name: data.name,
      category: data.category,
      adapter: data.adapter,
      base_url: data.base_url,
      model: data.model,
      capabilities: data.capabilities,
      enabled: data.enabled,
      priority: data.priority,
      timeout_ms: data.timeout_ms,
      notes: data.notes ?? null,
      updated_at: new Date().toISOString(),
    };
    let id = data.id ?? null;
    if (id) {
      await db.from("ai_providers").update(row as never).eq("id", id);
    } else {
      const { data: created, error } = await db.from("ai_providers").insert(row as never).select("id").maybeSingle();
      if (error || !created) throw new Error("Could not create the provider.");
      id = created.id;
    }
    if (data.api_key) {
      await db
        .from("ai_provider_secrets")
        .upsert({ provider_id: id!, api_key: data.api_key, updated_at: new Date().toISOString() } as never);
      await db.from("ai_providers").update({ has_secret: true } as never).eq("id", id!);
    }
    // Never place the credential itself in audit metadata.
    await audit(context.userId, data.id ? "provider.updated" : "provider.created", {
      provider_id: id,
      name: data.name,
      adapter: data.adapter,
      capabilities: data.capabilities,
      key_rotated: Boolean(data.api_key),
    });
    return { id };
  });

export const deleteProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const db = await admin();
    await db.from("ai_providers").delete().eq("id", data.id);
    await audit(context.userId, "provider.deleted", { provider_id: data.id });
    return { ok: true };
  });

export const testProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }): Promise<{ status: string }> => {
    await assertStaff(context as never);
    const db = await admin();
    const { data: p } = await db.from("ai_providers").select("*").eq("id", data.id).maybeSingle();
    if (!p) throw new Error("Provider not found.");
    const { data: secret } = await db
      .from("ai_provider_secrets")
      .select("api_key")
      .eq("provider_id", data.id)
      .maybeSingle();
    const { testProviderConnection } = await import("./gateway.server");
    const status = await testProviderConnection({
      id: p.id,
      name: p.name,
      adapter: p.adapter,
      baseUrl: p.base_url,
      model: p.model,
      timeoutMs: p.timeout_ms ?? 60000,
      apiKey: secret?.api_key ?? null,
      builtin: false,
    });
    await db
      .from("ai_providers")
      .update({ last_test_status: status, last_test_at: new Date().toISOString() } as never)
      .eq("id", data.id);
    return { status };
  });

export const setCapabilityRoute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        capability: z.enum(CAPABILITIES),
        primary_provider_id: z.string().uuid().nullable(),
        fallback_provider_id: z.string().uuid().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const db = await admin();
    await db.from("capability_routes").upsert({
      capability: data.capability,
      primary_provider_id: data.primary_provider_id,
      fallback_provider_id: data.fallback_provider_id,
      updated_at: new Date().toISOString(),
    } as never);
    await audit(context.userId, "capability.route_changed", data);
    return { ok: true };
  });

/* --------------------------------------------------------------- module control */

export const syncModuleSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as never);
    const db = await admin();
    const { data: existing } = await db.from("module_settings").select("slug");
    const have = new Set((existing ?? []).map((r) => r.slug));
    const missing = MODULE_MANIFEST.filter((m) => !have.has(m.slug)).map((m) => ({
      slug: m.slug,
      status: m.defaultStatus,
      visible: true,
      min_plan: m.minPlan,
      credits_per_run: m.creditsPerRun,
    }));
    if (missing.length) await db.from("module_settings").insert(missing as never);
    return { inserted: missing.length };
  });

export const updateModuleSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        slugs: z.array(z.string().min(1)).min(1).max(30),
        status: z.enum(["live", "beta", "coming_soon", "maintenance", "disabled"]).optional(),
        visible: z.boolean().optional(),
        min_plan: z.enum(["free", "starter", "plus", "pro", "business"]).optional(),
        credits_per_run: z.number().int().min(0).max(500).optional(),
        daily_limit: z.number().int().min(0).max(100000).nullable().optional(),
        monthly_limit: z.number().int().min(0).max(1000000).nullable().optional(),
        coming_soon_message: z.string().max(300).nullable().optional(),
        maintenance_message: z.string().max(300).nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const db = await admin();
    const { slugs, ...patch } = data;
    const update = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    if (Object.keys(update).length === 0) return { ok: true };
    await db
      .from("module_settings")
      .update({ ...update, updated_at: new Date().toISOString() } as never)
      .in("slug", slugs);
    await audit(context.userId, "module.settings_changed", { slugs, ...update });
    return { ok: true };
  });

/* ------------------------------------------------------------------- safety */

export const setPlatformFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        key: z.enum(["ai_emergency_stop", "payments_disable_checkout", "payments_maintenance"]),
        enabled: z.boolean(),
        confirm: z.literal("CONFIRM"),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const db = await admin();
    await db
      .from("platform_flags")
      .upsert({ key: data.key, enabled: data.enabled, updated_at: new Date().toISOString() } as never);
    await audit(context.userId, "platform.flag_changed", { key: data.key, enabled: data.enabled });
    return { ok: true };
  });

/* ------------------------------------------------------------------ payments */

export const savePaymentProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        environment: z.enum(["sandbox", "live"]),
        enabled: z.boolean(),
        key_id: z.string().min(4).max(120),
        api_secret: z.string().min(8).max(300).optional(),
        webhook_secret: z.string().min(8).max(300).optional(),
        confirm_live: z.literal("CONFIRM").optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    if (data.environment === "live" && data.confirm_live !== "CONFIRM") {
      throw new Error("Live mode requires explicit confirmation.");
    }
    const db = await admin();
    if (data.api_secret || data.webhook_secret) {
      const patch: Record<string, unknown> = { provider: "razorpay", updated_at: new Date().toISOString() };
      if (data.api_secret) patch["api_secret"] = data.api_secret;
      if (data.webhook_secret) patch["webhook_secret"] = data.webhook_secret;
      await db.from("payment_provider_secrets").upsert(patch as never);
    }
    const { data: secrets } = await db
      .from("payment_provider_secrets")
      .select("api_secret, webhook_secret")
      .eq("provider", "razorpay")
      .maybeSingle();
    const configured = Boolean(data.key_id && secrets?.api_secret);
    await db.from("payment_provider_config").upsert({
      provider: "razorpay",
      enabled: data.enabled,
      environment: data.environment,
      key_id: data.key_id,
      webhook_configured: Boolean(secrets?.webhook_secret),
      status: !configured
        ? "not_configured"
        : !data.enabled
          ? "disabled"
          : data.environment === "live"
            ? "live"
            : "test_mode",
      updated_at: new Date().toISOString(),
    } as never);
    await audit(context.userId, "payments.configuration_changed", {
      provider: "razorpay",
      environment: data.environment,
      enabled: data.enabled,
      secret_rotated: Boolean(data.api_secret),
      webhook_secret_rotated: Boolean(data.webhook_secret),
    });
    return { ok: true };
  });

/* ------------------------------------------------------------------ analytics */

export type AdminOverview = {
  users: { total: number; newToday: number; newThisMonth: number; activeNow: number; byPlan: Record<string, number> };
  subscriptions: { active: number; byPlan: Record<string, number> };
  credits: { allocated: number; consumed: number; refunded: number };
  ai: { total: number; failed: number; running: number; avgLatencyMs: number | null };
  storageBytes: number;
  providers: { total: number; enabled: number; connected: number };
  modules: Record<string, number>;
  payments: { provider: string; status: string; environment: string; webhook_configured: boolean };
  flags: Record<string, boolean>;
};

export const getAdminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    await assertStaff(context as never);
    const db = await admin();
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfDay);
    startOfMonth.setUTCDate(1);
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();

    const [profiles, subs, ledger, jobs, providers, modules, payments, flags] = await Promise.all([
      db.from("profiles").select("plan, created_at, last_seen_at, storage_used_bytes"),
      db.from("subscriptions").select("plan, status"),
      db.from("credit_ledger").select("amount, transaction_type"),
      db.from("ai_jobs").select("status, started_at, completed_at"),
      db.from("ai_providers").select("enabled, last_test_status"),
      db.from("module_settings").select("status"),
      db.from("payment_provider_config").select("*").eq("provider", "razorpay").maybeSingle(),
      db.from("platform_flags").select("key, enabled"),
    ]);

    const rows = profiles.data ?? [];
    const byPlan: Record<string, number> = {};
    for (const p of rows) byPlan[p.plan] = (byPlan[p.plan] ?? 0) + 1;

    const subsByPlan: Record<string, number> = {};
    let activeSubs = 0;
    for (const s of subs.data ?? []) {
      if (s.status === "active") {
        activeSubs += 1;
        subsByPlan[s.plan] = (subsByPlan[s.plan] ?? 0) + 1;
      }
    }

    let allocated = 0;
    let consumed = 0;
    let refunded = 0;
    for (const l of ledger.data ?? []) {
      const amount = Number(l.amount ?? 0);
      if (l.transaction_type === "refund") refunded += Math.abs(amount);
      else if (amount < 0) consumed += Math.abs(amount);
      else allocated += amount;
    }

    const jobRows = jobs.data ?? [];
    const durations = jobRows
      .filter((j) => j.started_at && j.completed_at)
      .map((j) => new Date(j.completed_at as string).getTime() - new Date(j.started_at as string).getTime())
      .filter((d) => d >= 0);

    const moduleCounts: Record<string, number> = {};
    for (const m of modules.data ?? []) moduleCounts[m.status] = (moduleCounts[m.status] ?? 0) + 1;

    const flagMap: Record<string, boolean> = {};
    for (const f of flags.data ?? []) flagMap[f.key] = f.enabled;

    return {
      users: {
        total: rows.length,
        newToday: rows.filter((p) => p.created_at >= startOfDay.toISOString()).length,
        newThisMonth: rows.filter((p) => p.created_at >= startOfMonth.toISOString()).length,
        activeNow: rows.filter((p) => (p.last_seen_at ?? "") >= fiveMinAgo).length,
        byPlan,
      },
      subscriptions: { active: activeSubs, byPlan: subsByPlan },
      credits: { allocated, consumed, refunded },
      ai: {
        total: jobRows.length,
        failed: jobRows.filter((j) => j.status === "failed").length,
        running: jobRows.filter((j) => j.status === "running").length,
        avgLatencyMs: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
      },
      storageBytes: rows.reduce((sum, p) => sum + Number(p.storage_used_bytes ?? 0), 0),
      providers: {
        total: (providers.data ?? []).length,
        enabled: (providers.data ?? []).filter((p) => p.enabled).length,
        connected: (providers.data ?? []).filter((p) => p.last_test_status === "CONNECTED").length,
      },
      modules: moduleCounts,
      payments: {
        provider: "razorpay",
        status: payments.data?.status ?? "not_configured",
        environment: payments.data?.environment ?? "sandbox",
        webhook_configured: payments.data?.webhook_configured ?? false,
      },
      flags: flagMap,
    };
  });
