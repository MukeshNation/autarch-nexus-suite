import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { BILLING_PLANS } from "@/lib/payment.functions";

type RazorpayEntity = {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  notes?: Record<string, string>;
};
type RazorpayWebhook = {
  event?: string;
  payload?: { payment?: { entity?: RazorpayEntity }; order?: { entity?: RazorpayEntity } };
};

function secureEqual(expected: string, actual: string) {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}

export const Route = createFileRoute("/api/payments/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const eventId = request.headers.get("x-razorpay-event-id") ?? "";
        if (!signature || !eventId) return new Response("Missing signature", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: secretRow } = await supabaseAdmin
          .from("payment_provider_secrets")
          .select("webhook_secret")
          .eq("provider", "razorpay")
          .maybeSingle();
        if (!secretRow?.webhook_secret)
          return new Response("Webhook not configured", { status: 503 });

        const expected = createHmac("sha256", secretRow.webhook_secret)
          .update(rawBody)
          .digest("hex");
        if (!secureEqual(expected, signature))
          return new Response("Invalid signature", { status: 401 });

        const { error: claimError } = await supabaseAdmin
          .from("payment_webhook_events")
          .insert({ id: eventId, event_type: "received" } as never);
        if (claimError?.code === "23505") return new Response("Already processed", { status: 200 });
        if (claimError) return new Response("Could not claim event", { status: 500 });

        try {
          const event = JSON.parse(rawBody) as RazorpayWebhook;
          await supabaseAdmin
            .from("payment_webhook_events")
            .update({ event_type: event.event ?? "unknown" } as never)
            .eq("id", eventId);

          if (event.event === "payment.captured") {
            const payment = event.payload?.payment?.entity;
            const providerOrderId = payment?.order_id;
            if (!payment?.id || !providerOrderId)
              throw new Error("Payment identifiers are missing.");

            const { data: order } = await supabaseAdmin
              .from("payment_orders")
              .select("*")
              .eq("provider_order_id", providerOrderId)
              .maybeSingle();
            if (!order) throw new Error("Autarch payment order was not found.");

            if (order.status !== "paid") {
              const plan = BILLING_PLANS[order.plan as keyof typeof BILLING_PLANS];
              if (
                !plan ||
                order.amount_minor !== plan.amount ||
                order.currency !== plan.currency ||
                payment.amount !== plan.amount ||
                payment.currency !== plan.currency
              ) {
                throw new Error("Payment amount or plan does not match.");
              }
              const { error: activationError } = await supabaseAdmin.rpc("activate_paid_plan", {
                _user_id: order.user_id,
                _plan: order.plan,
                _payment_id: payment.id,
                _credits: plan.credits,
              } as never);
              if (activationError) throw new Error("Paid plan activation failed.");
              await supabaseAdmin
                .from("payment_orders")
                .update({
                  provider_payment_id: payment.id,
                  status: "paid",
                  paid_at: new Date().toISOString(),
                } as never)
                .eq("id", order.id);
            }
          }

          if (event.event === "payment.failed") {
            const payment = event.payload?.payment?.entity;
            if (payment?.order_id) {
              await supabaseAdmin
                .from("payment_orders")
                .update({ provider_payment_id: payment.id ?? null, status: "failed" } as never)
                .eq("provider_order_id", payment.order_id);
            }
          }

          await supabaseAdmin
            .from("payment_webhook_events")
            .update({ processed_at: new Date().toISOString() } as never)
            .eq("id", eventId);
          await supabaseAdmin
            .from("payment_provider_config")
            .update({ last_event_at: new Date().toISOString(), last_error: null } as never)
            .eq("provider", "razorpay");
          return new Response("OK", { status: 200 });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Webhook processing failed";
          await supabaseAdmin
            .from("payment_webhook_events")
            .update({ error: message } as never)
            .eq("id", eventId);
          await supabaseAdmin
            .from("payment_provider_config")
            .update({ last_error: message } as never)
            .eq("provider", "razorpay");
          return new Response("Processing failed", { status: 500 });
        }
      },
    },
  },
});
