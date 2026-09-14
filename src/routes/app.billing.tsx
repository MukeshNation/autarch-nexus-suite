import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { WorkspacePage } from "@/components/workspace/page";
import { Button } from "@/components/ui/button";
import { useAccountOverview, useLedger } from "@/lib/billing-data";
import { createRazorpayCheckout } from "@/lib/payment.functions";

export const Route = createFileRoute("/app/billing")({
  component: BillingPage,
});

const PLANS = [
  {
    code: "starter" as const,
    name: "Starter",
    price: "$19",
    note: "2,500 credits, core capabilities and standard queue.",
  },
  {
    code: "pro" as const,
    name: "Pro",
    price: "$49",
    note: "10,000 credits, priority queue, automations and higher storage.",
  },
];

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function BillingPage() {
  const queryClient = useQueryClient();
  const createCheckout = useServerFn(createRazorpayCheckout);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const overview = useAccountOverview();
  const ledger = useLedger();
  const profile = overview.data?.profile ?? null;
  const subscription = overview.data?.subscription ?? null;
  const currentPlan = (subscription?.plan ?? profile?.plan ?? "free").toLowerCase();

  async function checkout(plan: "starter" | "pro") {
    setBusyPlan(plan);
    try {
      const result = await createCheckout({ data: { plan } });
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Razorpay checkout could not load."));
          document.head.appendChild(script);
        });
      }
      const checkoutWindow = new window.Razorpay!({
        key: result.keyId,
        order_id: result.orderId,
        amount: result.amount,
        currency: result.currency,
        name: "Autarch AI",
        description: `${result.planName} · 30 days`,
        theme: { color: "#111111" },
        handler: () => {
          toast.success(
            "Payment received. Your plan will activate after secure webhook verification.",
          );
          window.setTimeout(() => {
            void queryClient.invalidateQueries({ queryKey: ["account-overview"] });
            void queryClient.invalidateQueries({ queryKey: ["credit-ledger"] });
          }, 2500);
        },
        modal: { ondismiss: () => toast.info("Checkout closed. No plan change was made.") },
      });
      checkoutWindow.open();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout could not be created.");
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <WorkspacePage
      title="Billing"
      lead="Your plan, credit balance and verified payment history. Card details are handled securely by Razorpay and are never stored by Autarch."
    >
      <section className="panel p-4">
        <span className="label-mono">Current account</span>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 text-[0.7rem]">
          <div>
            <span className="text-muted-foreground">Plan</span>
            <div className="mt-1 text-sm capitalize">{currentPlan}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Status</span>
            <div className="mt-1 text-sm">{subscription?.status ?? "active"}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Credit balance</span>
            <div className="mt-1 text-sm">{profile?.credit_balance ?? 0} cr</div>
          </div>
        </div>
        {subscription?.current_period_end && (
          <p className="mt-3 text-[0.68rem] text-muted-foreground">
            Current period ends {new Date(subscription.current_period_end).toLocaleDateString()}
            {subscription.granted_free ? " · granted free by an administrator" : ""}
          </p>
        )}
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {PLANS.map((p) => {
          const active = currentPlan === p.name.toLowerCase();
          return (
            <article
              key={p.name}
              className={`panel p-5 ${active ? "border-border-strong shadow-studio" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span className="label-mono">{p.name}</span>
                {active && <span className="label-mono ml-auto">Your plan</span>}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl">{p.price}</span>
                <span className="text-[0.68rem] text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{p.note}</p>
              <Button
                variant={active ? "outline" : "default"}
                className="mt-4 w-full text-xs"
                disabled={active || busyPlan !== null}
                onClick={() => void checkout(p.code)}
              >
                {active ? "Active" : busyPlan === p.code ? "Opening checkout…" : `Choose ${p.name}`}
              </Button>
            </article>
          );
        })}
      </div>

      <section className="panel mt-4 p-4">
        <span className="label-mono">Credit history</span>
        {(ledger.data ?? []).length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            No credit movements recorded yet. Runs, refunds and administrator grants will appear
            here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {(ledger.data ?? []).slice(0, 12).map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-2 text-[0.68rem]">
                <span className="text-muted-foreground">
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
                <span className="flex-1">{entry.transaction_type.replace(/_/g, " ")}</span>
                <span>{entry.amount > 0 ? `+${entry.amount}` : entry.amount}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[0.68rem] text-muted-foreground">
          Successful plan purchases appear after Razorpay webhook verification. Autarch never stores
          card details.
        </p>
      </section>
    </WorkspacePage>
  );
}
