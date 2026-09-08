/**
 * AUTARCH AI — central AI gateway (server only).
 *
 * MODULE -> REQUIRED CAPABILITY -> CAPABILITY ROUTER -> ACTIVE PROVIDER -> ADAPTER -> API
 *
 * Modules never reference a provider directly. Whatever provider is active for a
 * capability serves every module that declares it. Provider secrets are read with
 * the service role and never leave the server.
 */
import type { Capability } from "./capabilities";

export type ResolvedProvider = {
  id: string | null;
  name: string;
  adapter: string;
  baseUrl: string | null;
  model: string | null;
  timeoutMs: number;
  apiKey: string | null;
  builtin: boolean;
};

export type GatewayResult = {
  text: string;
  providerId: string | null;
  providerName: string;
  model: string;
  latencyMs: number;
  usedFallback: boolean;
};

export class GatewayError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const BUILTIN_MODEL = "google/gemini-3.7-flash";

function builtinProvider(): ResolvedProvider | null {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return null;
  return {
    id: null,
    name: "Autarch built-in AI",
    adapter: "builtin_lovable",
    baseUrl: "https://ai.gateway.lovable.dev/v1",
    model: BUILTIN_MODEL,
    timeoutMs: 90_000,
    apiKey: key,
    builtin: true,
  };
}

type AdminClient = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function loadProvider(admin: AdminClient, id: string | null): Promise<ResolvedProvider | null> {
  if (!id) return null;
  const { data } = await admin.from("ai_providers").select("*").eq("id", id).maybeSingle();
  if (!data || !data.enabled) return null;
  const { data: secret } = await admin
    .from("ai_provider_secrets")
    .select("api_key")
    .eq("provider_id", id)
    .maybeSingle();
  return {
    id: data.id,
    name: data.name,
    adapter: data.adapter,
    baseUrl: data.base_url,
    model: data.model,
    timeoutMs: data.timeout_ms ?? 60_000,
    apiKey: secret?.api_key ?? null,
    builtin: false,
  };
}

/** Which provider currently powers a capability (primary + fallback + built-in). */
export async function resolveCapabilityChain(capability: Capability): Promise<ResolvedProvider[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: route } = await supabaseAdmin
    .from("capability_routes")
    .select("primary_provider_id, fallback_provider_id")
    .eq("capability", capability)
    .maybeSingle();

  const chain: ResolvedProvider[] = [];
  const primary = await loadProvider(supabaseAdmin, route?.primary_provider_id ?? null);
  if (primary) chain.push(primary);
  const fallback = await loadProvider(supabaseAdmin, route?.fallback_provider_id ?? null);
  if (fallback) chain.push(fallback);
  const builtin = builtinProvider();
  if (builtin && chain.length === 0) chain.push(builtin);
  return chain;
}

/** Normalized single-call text completion against one provider. */
export async function callTextProvider(
  provider: ResolvedProvider,
  system: string,
  prompt: string,
): Promise<string> {
  if (provider.adapter !== "openai_compatible" && provider.adapter !== "builtin_lovable") {
    throw new GatewayError("ADAPTER REQUIRED", "No adapter is implemented for this provider protocol yet.");
  }
  if (!provider.apiKey) throw new GatewayError("INVALID KEY", "Provider has no stored credential.");
  if (!provider.baseUrl) throw new GatewayError("INVALID BASE URL", "Provider base URL is missing.");
  if (!provider.model) throw new GatewayError("INVALID MODEL", "Provider model is missing.");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), provider.timeoutMs);
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (provider.builtin) headers["Lovable-API-Key"] = provider.apiKey;
    else headers["Authorization"] = `Bearer ${provider.apiKey}`;

    const response = await fetch(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new GatewayError("AUTH FAILED", "The provider rejected the stored credential.");
      }
      if (response.status === 404) throw new GatewayError("INVALID MODEL", "The provider rejected the model id.");
      if (response.status === 429) throw new GatewayError("RATE LIMITED", "The provider is rate limiting requests.");
      if (response.status === 402) throw new GatewayError("PROVIDER UNAVAILABLE", "The provider reports no remaining quota.");
      throw new GatewayError("PROVIDER UNAVAILABLE", "The provider could not complete this request.");
    }

    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = payload.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new GatewayError("UNKNOWN ERROR", "The provider returned an empty response.");
    return text;
  } catch (error) {
    if (error instanceof GatewayError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new GatewayError("TIMEOUT", "The provider timed out.");
    }
    throw new GatewayError("PROVIDER UNAVAILABLE", "The provider could not be reached.");
  } finally {
    clearTimeout(timer);
  }
}

/** Capability-routed text generation with primary -> fallback, no fake output. */
export async function runTextCapability(
  capability: Capability,
  system: string,
  prompt: string,
): Promise<GatewayResult> {
  const chain = await resolveCapabilityChain(capability);
  if (chain.length === 0) {
    throw new GatewayError("MISSING PROVIDER", `No active provider is configured for ${capability}.`);
  }

  let lastError: GatewayError | null = null;
  for (let i = 0; i < chain.length; i += 1) {
    const provider = chain[i]!;
    const started = Date.now();
    try {
      const text = await callTextProvider(provider, system, prompt);
      return {
        text,
        providerId: provider.id,
        providerName: provider.name,
        model: provider.model ?? "unknown",
        latencyMs: Date.now() - started,
        usedFallback: i > 0,
      };
    } catch (error) {
      lastError = error instanceof GatewayError ? error : new GatewayError("UNKNOWN ERROR", "Provider failed.");
      // Only transient classes are eligible for fallback.
      if (!["TIMEOUT", "RATE LIMITED", "PROVIDER UNAVAILABLE"].includes(lastError.code)) break;
    }
  }
  throw lastError ?? new GatewayError("UNKNOWN ERROR", "Provider failed.");
}

/** Minimal, safe connection test used by the admin provider manager. */
export async function testProviderConnection(provider: ResolvedProvider): Promise<string> {
  try {
    await callTextProvider(provider, "Reply with the single word OK.", "ping");
    return "CONNECTED";
  } catch (error) {
    return error instanceof GatewayError ? error.code : "UNKNOWN ERROR";
  }
}
