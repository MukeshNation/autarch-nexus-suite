import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const BILLING_PLANS = {
  starter: { name: "Starter", amount: 1900, currency: "USD", credits: 2500 },
  pro: { name: "Pro", amount: 4900, currency: "USD", credits: 10000 },
} as const;

const CheckoutInput = z.object({ plan: z.enum(["starter", "pro"]) });

export const createRazorpayCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CheckoutInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: config }, { data: secrets }, { data: flags }] = await Promise.all([
      supabaseAdmin
        .from("payment_provider_config")
        .select("*")
        .eq("provider", "razorpay")
        .maybeSingle(),
      supabaseAdmin
        .from("payment_provider_secrets")
        .select("api_secret")
        .eq("provider", "razorpay")
        .maybeSingle(),
      supabaseAdmin
        .from("platform_flags")
        .select("key,enabled")
        .in("key", ["payments_disable_checkout", "payments_maintenance"]),
    ]);

    const flagMap = Object.fromEntries((flags ?? []).map((flag) => [flag.key, flag.enabled]));
    if (flagMap.payments_maintenance)
      throw new Error("Payments are temporarily under maintenance.");
    if (flagMap.payments_disable_checkout) throw new Error("New checkouts are currently disabled.");
    if (!config?.enabled || !config.key_id || !secrets?.api_secret) {
      throw new Error("Razorpay checkout is not configured yet.");
    }

    const plan = BILLING_PLANS[data.plan];
    const { data: orderRow, error: insertError } = await supabaseAdmin
      .from("payment_orders")
      .insert({
        user_id: context.userId,
        plan: data.plan,
        amount_minor: plan.amount,
        currency: plan.currency,
        status: "creating",
      } as never)
      .select("id")
      .maybeSingle();
    if (insertError || !orderRow) throw new Error("Could not start the checkout.");

    const authorization = Buffer.from(`${config.key_id}:${secrets.api_secret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { authorization: `Basic ${authorization}`, "content-type": "application/json" },
      body: JSON.stringify({
        amount: plan.amount,
        currency: plan.currency,
        receipt: orderRow.id,
        notes: { user_id: context.userId, plan: data.plan, autarch_order_id: orderRow.id },
      }),
    });
    const providerOrder = (await response.json()) as {
      id?: string;
      error?: { description?: string };
    };
    if (!response.ok || !providerOrder.id) {
      const message = providerOrder.error?.description ?? "Razorpay rejected checkout creation.";
      await supabaseAdmin
        .from("payment_orders")
        .update({ status: "failed" } as never)
        .eq("id", orderRow.id);
      throw new Error(message);
    }

    await supabaseAdmin
      .from("payment_orders")
      .update({ provider_order_id: providerOrder.id, status: "created" } as never)
      .eq("id", orderRow.id);

    return {
      keyId: config.key_id,
      orderId: providerOrder.id,
      amount: plan.amount,
      currency: plan.currency,
      plan: data.plan,
      planName: plan.name,
      environment: config.environment,
    };
  });
