import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { Section, SectionHeader } from "@/components/site/section";
import { Button } from "@/components/ui/button";

const TITLE = "Pricing — Autarch AI Starter and Pro plans";
const DESC =
  "Starter at $19/month and Pro at $49/month. Defined monthly credits, defined storage, and honest limits on third-party compute.";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: PricingPage,
});

const PLANS = [
  {
    name: "Starter",
    price: "$19",
    blurb: "For individuals running focused AI work.",
    features: [
      "Defined monthly credit allowance",
      "Core capabilities",
      "Standard processing queue",
      "Defined project storage",
      "Projects, tasks and files",
      "Export of all outputs",
    ],
  },
  {
    name: "Pro",
    price: "$49",
    blurb: "For teams running agents and heavy media work.",
    features: [
      "Larger credit allowance",
      "Priority processing queue",
      "Advanced workflows and agents",
      "Larger project storage",
      "Approval gates and audit log",
      "Connected accounts and automation",
    ],
    featured: true,
  },
];

function PricingPage() {
  return (
    <SiteShell>
      <Section bordered={false}>
        <SectionHeader
          index="Pricing"
          title="Two plans, metered honestly"
          lead="Every AI operation consumes a configurable amount of credits. Credits are reserved before execution and finalised after, so concurrent requests cannot bypass your limit."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`panel p-6 ${plan.featured ? "border-border-strong shadow-studio" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span className="label-mono">{plan.name}</span>
                {plan.featured && <span className="label-mono ml-auto">Recommended</span>}
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl tracking-tight">{plan.price}</span>
                <span className="text-xs text-muted-foreground">/month</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{plan.blurb}</p>
              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-xs">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.featured ? "default" : "outline"}
                className="mt-6 w-full text-xs"
              >
                <Link to="/signup">Choose {plan.name}</Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-[0.7rem] leading-relaxed text-muted-foreground">
          Autarch does not promise uncontrolled unlimited third-party compute. Capabilities that depend on a paid
          external service are labelled in the module directory, and checkout is handled by a hosted payment provider —
          card numbers and security codes are never stored by Autarch.
        </p>
      </Section>
    </SiteShell>
  );
}
