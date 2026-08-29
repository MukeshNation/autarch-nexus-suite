import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/workspace/page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/billing")({
  component: BillingPage,
});

const PLANS = [
  { name: "Starter", price: "$19", note: "Monthly credit allowance, core capabilities, standard queue." },
  { name: "Pro", price: "$49", note: "Larger allowance, priority queue, automations, higher storage." },
];

function BillingPage() {
  return (
    <WorkspacePage
      title="Billing"
      lead="Plans, credits and invoices. Payment processing is not connected in this phase — no charge can be made."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {PLANS.map((p) => (
          <article key={p.name} className="panel p-5">
            <span className="label-mono">{p.name}</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-3xl">{p.price}</span>
              <span className="font-mono text-[0.68rem] text-muted-foreground">/month</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{p.note}</p>
            <Button variant="outline" className="mt-4 w-full font-mono text-xs" disabled>
              Requires paid service
            </Button>
          </article>
        ))}
      </div>

      <section className="panel mt-4 p-4">
        <span className="label-mono">Invoices</span>
        <p className="mt-2 text-xs text-muted-foreground">
          Invoices, receipts and credit top-ups will appear here once a payment provider is connected. Autarch never
          stores card details — a certified provider handles them.
        </p>
      </section>
    </WorkspacePage>
  );
}
