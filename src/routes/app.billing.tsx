import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/workspace/page";
import { Button } from "@/components/ui/button";
import { useAccountOverview, useLedger } from "@/lib/billing-data";

export const Route = createFileRoute("/app/billing")({
  component: BillingPage,
});

const PLANS = [
  { name: "Starter", price: "$19", note: "Monthly credit allowance, core capabilities, standard queue." },
  { name: "Pro", price: "$49", note: "Larger allowance, priority queue, automations, higher storage." },
];

function BillingPage() {
  const overview = useAccountOverview();
  const ledger = useLedger();
  const profile = overview.data?.profile ?? null;
  const subscription = overview.data?.subscription ?? null;
  const currentPlan = (subscription?.plan ?? profile?.plan ?? "free").toLowerCase();

  return (
    <WorkspacePage
      title="Billing"
      lead="Your live plan, credit balance and credit history. Card processing is not connected yet, so no charge can be made."
    >
      <section className="panel p-4">
        <span className="label-mono">Current account</span>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 font-mono text-[0.7rem]">
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
          <p className="mt-3 font-mono text-[0.68rem] text-muted-foreground">
            Current period ends {new Date(subscription.current_period_end).toLocaleDateString()}
            {subscription.granted_free ? " · granted free by an administrator" : ""}
          </p>
        )}
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {PLANS.map((p) => {
          const active = currentPlan === p.name.toLowerCase();
          return (
            <article key={p.name} className={`panel p-5 ${active ? "border-border-strong shadow-studio" : ""}`}>
              <div className="flex items-center gap-2">
                <span className="label-mono">{p.name}</span>
                {active && <span className="label-mono ml-auto">Your plan</span>}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-3xl">{p.price}</span>
                <span className="font-mono text-[0.68rem] text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{p.note}</p>
              <Button variant="outline" className="mt-4 w-full font-mono text-xs" disabled>
                {active ? "Active" : "Requires paid service"}
              </Button>
            </article>
          );
        })}
      </div>

      <section className="panel mt-4 p-4">
        <span className="label-mono">Credit history</span>
        {(ledger.data ?? []).length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            No credit movements recorded yet. Runs, refunds and administrator grants will appear here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {(ledger.data ?? []).slice(0, 12).map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-2 font-mono text-[0.68rem]">
                <span className="text-muted-foreground">{new Date(entry.created_at).toLocaleDateString()}</span>
                <span className="flex-1">{entry.transaction_type.replace(/_/g, " ")}</span>
                <span>{entry.amount > 0 ? `+${entry.amount}` : entry.amount}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 font-mono text-[0.68rem] text-muted-foreground">
          Invoices and top-ups will appear here once a payment provider is connected. Autarch never stores card
          details.
        </p>
      </section>
    </WorkspacePage>
  );
}
