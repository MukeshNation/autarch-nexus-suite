import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/site-shell";
import { Section, SectionHeader } from "@/components/site/section";
import { Composer } from "@/components/autarch/composer";
import { HeroDiagram } from "@/components/autarch/hero-diagram";
import { StatusBadge } from "@/components/autarch/status-badge";
import { MODULE_GROUPS, modulesByGroup } from "@/lib/modules";
import { INDUSTRIES } from "@/lib/industries";
import { DEMO_WORKFLOWS } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";

const TITLE = "Autarch AI — Every industrial AI tool in one workspace";
const DESC =
  "Autarch AI unifies 23 AI capabilities — build, research, design, media, automation — inside one enterprise workspace with projects, files and an audit trail.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <SiteShell ambient>
      <section className="px-5 pt-16 pb-10 sm:px-8 sm:pt-24">
        <div className="mx-auto w-full max-w-6xl">
          <div className="label-mono mb-6">One workspace · 23 capabilities</div>
          <h1 className="max-w-3xl text-3xl leading-[1.15] sm:text-5xl">
            Every Industrial AI Tool.
            <br />
            One Supreme Enterprise Workspace.
            <br />
            Infinite Power.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Ask once. Autarch selects the capability, you confirm, it executes, and the output lands in your project —
            ready to continue in the next module.
          </p>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-start">
            <Composer className="max-w-2xl" />
            <HeroDiagram className="hidden h-64 w-full text-foreground/70 lg:block" />
          </div>
        </div>
      </section>

      <Section>
        <SectionHeader
          index="Capabilities"
          title="Twenty-three modules, grouped so nothing overwhelms you"
          lead="Every capability has its own specialized workspace, and every workspace shares the same projects, files and history."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MODULE_GROUPS.map((group) => (
            <div key={group.id} className="panel hover-lift p-5">
              <div className="label-mono">{group.name}</div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{group.blurb}</p>
              <ul className="mt-4 space-y-2">
                {modulesByGroup(group.id).map((m) => (
                  <li key={m.slug}>
                    <Link
                      to="/app/modules/$slug"
                      params={{ slug: m.slug }}
                      className="flex items-baseline gap-2 rounded px-1 py-1 text-[0.8rem] hover:bg-secondary"
                    >
                      <span className="font-mono text-[0.65rem] text-muted-foreground">{m.id}</span>
                      <span className="flex-1">{m.name}</span>
                      <StatusBadge status={m.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader
          index="Cross-module"
          title="Output from one module is input to the next"
          lead="Autarch is one platform, not 23 tools. Every generated asset can be saved to a project and reused elsewhere."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {DEMO_WORKFLOWS.map((w) => (
            <div key={w.name} className="panel p-5">
              <div className="font-mono text-sm">{w.name}</div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-[0.65rem] text-muted-foreground">
                {w.steps.map((s, i) => (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className="rounded border border-border px-1.5 py-0.5">{s}</span>
                    {i < w.steps.length - 1 && <span>→</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader
          index="Industries"
          title="Fifteen working contexts"
          lead="Each one maps to specific modules, input types and outputs."
        />
        <div className="mt-10 divide-y divide-border">
          {INDUSTRIES.map((ind) => (
            <article key={ind.slug} className="grid gap-4 py-7 md:grid-cols-[6rem_minmax(0,1fr)]">
              <div className="label-mono md:pt-1">{ind.id}</div>
              <div>
                <h3 className="text-lg">{ind.name}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{ind.can}</p>
                <dl className="mt-4 grid gap-4 text-xs sm:grid-cols-3">
                  <div>
                    <dt className="label-mono mb-1.5">Inputs</dt>
                    <dd className="text-muted-foreground">{ind.inputs.join(" · ")}</dd>
                  </div>
                  <div>
                    <dt className="label-mono mb-1.5">Workflow</dt>
                    <dd className="text-muted-foreground">{ind.workflow.join(" → ")}</dd>
                  </div>
                  <div>
                    <dt className="label-mono mb-1.5">Outputs</dt>
                    <dd className="text-muted-foreground">{ind.outputs.join(" · ")}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {ind.modules.map((slug) => (
                    <Link
                      key={slug}
                      to="/app/modules/$slug"
                      params={{ slug }}
                      className="rounded-full border border-border px-2.5 py-1 font-mono text-[0.65rem] hover:bg-secondary"
                    >
                      {slug}
                    </Link>
                  ))}
                  <Button asChild size="sm" variant="outline" className="ml-auto font-mono text-xs">
                    <Link to="/app">Open workspace</Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section className="text-center">
        <h2 className="text-2xl sm:text-3xl">Open the command center</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Phase 1 is the full product shell. Capability availability is labelled per module — no invented integrations.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild className="font-mono text-xs">
            <Link to="/app">Enter workspace</Link>
          </Button>
          <Button asChild variant="outline" className="font-mono text-xs">
            <Link to="/pricing">See pricing</Link>
          </Button>
        </div>
      </Section>
    </SiteShell>
  );
}
