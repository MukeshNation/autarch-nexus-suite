import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/site-shell";
import { Section, SectionHeader } from "@/components/site/section";
import { HeroDiagram } from "@/components/autarch/hero-diagram";
import { Button } from "@/components/ui/button";

const TITLE = "Product — how the Autarch workspace works";
const DESC =
  "One command composer routes your request to the right AI capability, executes with approval gates, and saves every output into your project.";

export const Route = createFileRoute("/product")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: ProductPage,
});

const FLOW = [
  ["Ask Autarch", "State the outcome in plain language, attach files, pick a project."],
  ["Capability routing", "Autarch recommends the module that fits; you can override it."],
  ["Confirm", "Nothing runs until you approve the plan and any external action."],
  ["Execute", "Long work runs as a background job with real state, not a spinner."],
  ["Save to project", "Outputs become project assets with history and an audit trail."],
  ["Continue elsewhere", "Reuse any asset as the input to another module."],
];

const PILLARS = [
  ["One project system", "Projects, tasks, files and generated assets are shared by all 23 modules."],
  ["Specialized surfaces", "An editor looks like an editor, a timeline looks like a timeline."],
  ["Background jobs", "Queued · Processing · Completed · Failed · Cancelled — survives a closed browser."],
  ["Metered execution", "Every run reserves credits, records usage, then finalises."],
  ["Authorized actions only", "External steps require a connected account and explicit approval."],
  ["Auditable", "Who asked, what ran, what it produced, what it cost."],
];

function ProductPage() {
  return (
    <SiteShell>
      <Section bordered={false}>
        <SectionHeader
          index="Product"
          title="One workspace that decides which tool to use"
          lead="Autarch is a single operating surface for AI work. The composer is the front door; the project is the memory."
        />
        <HeroDiagram className="mt-10 h-56 w-full text-foreground/70" />
      </Section>

      <Section>
        <SectionHeader index="Flow" title="Request to result" />
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FLOW.map(([t, d], i) => (
            <li key={t} className="panel hover-lift p-5">
              <div className="label-mono">{String(i + 1).padStart(2, "0")}</div>
              <h3 className="mt-2 text-base">{t}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <SectionHeader index="Architecture" title="Built to hold real workloads" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map(([t, d]) => (
            <div key={t} className="panel p-5">
              <h3 className="text-base">{t}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Button asChild className="text-xs">
            <Link to="/app">Open the command center</Link>
          </Button>
        </div>
      </Section>
    </SiteShell>
  );
}
