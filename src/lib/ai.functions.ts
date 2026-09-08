import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MODULE_SYSTEM_PROMPTS, getManifest, PLAN_RANK, TEXT_CAPABILITIES } from "./capabilities";

const RunInput = z.object({
  slug: z.string().min(1),
  moduleId: z.string().min(1),
  prompt: z.string().min(1).max(12000),
  projectId: z.string().uuid().nullable().optional(),
});

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;

export type RunModuleResult = {
  text: string;
  creditsUsed: number;
  balance: number;
  model: string;
  provider: string;
  usedFallback: boolean;
  latencyMs: number;
  jobId: string | null;
};

export const runModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RunInput.parse(input))
  .handler(async ({ data, context }): Promise<RunModuleResult> => {
    const { supabase, userId } = context;
    const manifest = getManifest(data.slug);
    if (!manifest) throw new Error("Unknown module.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Emergency stop (owner controlled).
    const { data: stop } = await supabaseAdmin
      .from("platform_flags")
      .select("enabled")
      .eq("key", "ai_emergency_stop")
      .maybeSingle();
    if (stop?.enabled) {
      throw new Error("AI generation is temporarily paused by the operator. Please try again later.");
    }

    // 2. Module status — the owner's switch, independent of provider availability.
    const { data: settings } = await supabaseAdmin
      .from("module_settings")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    const status = settings?.status ?? manifest.defaultStatus;
    if (status === "coming_soon") {
      throw new Error(settings?.coming_soon_message ?? "This capability is coming soon and cannot run yet.");
    }
    if (status === "maintenance") {
      throw new Error(settings?.maintenance_message ?? "This capability is temporarily under maintenance.");
    }
    if (status === "disabled") throw new Error("This capability is currently disabled.");

    // 3. Only text capabilities have an implemented adapter today.
    const capability = manifest.required.find((c) => TEXT_CAPABILITIES.includes(c));
    if (!capability) {
      throw new Error("This capability needs a provider type that is not supported yet.");
    }

    // 4. Plan entitlement.
    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", userId).maybeSingle();
    const minPlan = settings?.min_plan ?? manifest.minPlan;
    if ((PLAN_RANK[profile?.plan ?? "free"] ?? 0) < (PLAN_RANK[minPlan] ?? 0)) {
      throw new Error(`This capability requires the ${minPlan} plan or higher.`);
    }

    // 5. Rate limit (per user, sliding window).
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: recent } = await supabase
      .from("usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since);
    if ((recent ?? 0) >= RATE_LIMIT_MAX) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }

    const credits = settings?.credits_per_run ?? manifest.creditsPerRun;

    // 6. Reserve credits atomically so concurrent runs cannot overspend.
    const rpc = supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: number | null; error: { message: string } | null }>;
    const { data: reservedBalance, error: reserveError } = await rpc("spend_credits", {
      _amount: credits,
      _reference: data.slug,
    });
    if (reserveError) {
      if (/insufficient credits/i.test(reserveError.message)) {
        throw new Error("You are out of credits. Add credits to keep generating.");
      }
      throw new Error("Could not reserve credits for this run.");
    }
    const newBalance = reservedBalance ?? 0;

    const { data: job } = await supabase
      .from("ai_jobs")
      .insert({
        user_id: userId,
        module_id: data.moduleId,
        project_id: data.projectId ?? null,
        status: "running",
        progress: 10,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();
    const jobId = job?.id ?? null;

    // 7. Execute through the central gateway (capability router -> active provider).
    const { runTextCapability, GatewayError } = await import("./gateway.server");
    try {
      const result = await runTextCapability(
        capability,
        MODULE_SYSTEM_PROMPTS[data.slug] ?? "You are Autarch, a precise AI assistant.",
        data.prompt,
      );

      await supabaseAdmin.from("usage_events").insert({
        user_id: userId,
        module_id: data.moduleId,
        event_type: "text_generation",
        credits_used: credits,
        provider_cost: 0,
      });
      await supabaseAdmin.from("ai_generations").insert({
        user_id: userId,
        project_id: data.projectId ?? null,
        module_id: data.moduleId,
        generation_type: "text",
        output_reference: result.text.slice(0, 500),
      });
      if (jobId) {
        await supabase
          .from("ai_jobs")
          .update({ status: "completed", progress: 100, completed_at: new Date().toISOString() })
          .eq("id", jobId);
      }

      return {
        text: result.text,
        creditsUsed: credits,
        balance: newBalance,
        model: result.model,
        provider: result.providerName,
        usedFallback: result.usedFallback,
        latencyMs: result.latencyMs,
        jobId,
      };
    } catch (error) {
      // Failed run: give the reserved credits back. Never fabricate output.
      await rpc("refund_credits", { _amount: credits, _reference: data.slug });
      const message =
        error instanceof GatewayError
          ? error.code === "MISSING PROVIDER"
            ? "No AI provider is connected for this capability yet."
            : `The AI provider could not complete this request (${error.code}).`
          : error instanceof Error
            ? error.message
            : "Unknown error";
      if (jobId) {
        await supabase
          .from("ai_jobs")
          .update({
            status: "failed",
            progress: 100,
            error_message: message,
            completed_at: new Date().toISOString(),
          })
          .eq("id", jobId);
      }
      throw new Error(message);
    }
  });
