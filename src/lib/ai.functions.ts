import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MODULE_SYSTEM_PROMPTS, AI_TEXT_MODULES } from "./ai-capabilities";

const RunInput = z.object({
  slug: z.string().min(1),
  moduleId: z.string().min(1),
  prompt: z.string().min(1).max(12000),
  projectId: z.string().uuid().nullable().optional(),
});

const CREDITS_PER_RUN = 1;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;
const MODEL = "google/gemini-3.7-flash";

export type RunModuleResult = {
  text: string;
  creditsUsed: number;
  balance: number;
  model: string;
  latencyMs: number;
  jobId: string | null;
};

export const runModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RunInput.parse(input))
  .handler(async ({ data, context }): Promise<RunModuleResult> => {
    const { supabase, userId } = context;

    if (!AI_TEXT_MODULES.has(data.slug)) {
      throw new Error("This module is not connected to the AI gateway yet.");
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI gateway is not configured.");

    // Rate limit (per user, sliding window).
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: recent } = await supabase
      .from("usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since);
    if ((recent ?? 0) >= RATE_LIMIT_MAX) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }

    // Entitlement / credits — reserved atomically so concurrent runs cannot overspend.
    const rpc = supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: number | null; error: { message: string } | null }>;
    const { data: reservedBalance, error: reserveError } = await rpc("spend_credits", {
      _amount: CREDITS_PER_RUN,
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

    const started = Date.now();
    let text = "";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90_000);
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: MODULE_SYSTEM_PROMPTS[data.slug] ?? "You are Autarch, a precise AI assistant.",
            },
            { role: "user", content: data.prompt },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text();
        if (response.status === 429) throw new Error("The AI service is rate limited. Try again shortly.");
        if (response.status === 402) throw new Error("AI usage limit reached for this workspace.");
        if (response.status === 403) throw new Error("AI access is currently blocked for this workspace.");
        console.error("[ai-gateway]", response.status, body);
        throw new Error("The AI service could not complete this request.");
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      text = payload.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) throw new Error("The AI service returned an empty response.");
    } catch (error) {
      if (jobId) {
        await supabase
          .from("ai_jobs")
          .update({
            status: "failed",
            progress: 100,
            error_message: error instanceof Error ? error.message : "Unknown error",
            completed_at: new Date().toISOString(),
          })
          .eq("id", jobId);
      }
      throw error;
    }

    const latencyMs = Date.now() - started;

    // Finalise: privileged writes (ledger + usage are append-only for users).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const newBalance = balance - CREDITS_PER_RUN;

    await supabaseAdmin.from("profiles").update({ credit_balance: newBalance }).eq("id", userId);
    await supabaseAdmin.from("credit_ledger").insert({
      user_id: userId,
      transaction_type: "module_run",
      amount: -CREDITS_PER_RUN,
      balance_after: newBalance,
      reference_id: data.slug,
    });
    await supabaseAdmin.from("usage_events").insert({
      user_id: userId,
      module_id: data.moduleId,
      event_type: "text_generation",
      credits_used: CREDITS_PER_RUN,
      provider_cost: 0,
    });
    await supabaseAdmin.from("ai_generations").insert({
      user_id: userId,
      project_id: data.projectId ?? null,
      module_id: data.moduleId,
      generation_type: "text",
      output_reference: text.slice(0, 500),
    });

    if (jobId) {
      await supabase
        .from("ai_jobs")
        .update({ status: "completed", progress: 100, completed_at: new Date().toISOString() })
        .eq("id", jobId);
    }

    return { text, creditsUsed: CREDITS_PER_RUN, balance: newBalance, model: MODEL, latencyMs, jobId };
  });
