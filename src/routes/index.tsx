import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { Section, SectionHeader } from "@/components/site/section";
import { StatusBadge } from "@/components/autarch/status-badge";
import { AutarchMark } from "@/components/autarch/logo";
import { MODULE_GROUPS, modulesByGroup, MODULES } from "@/lib/modules";
import { INDUSTRIES } from "@/lib/industries";
import { DEMO_WORKFLOWS } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";

const TITLE = "Autarch AI — Every industrial AI tool in one workspace";
const DESC =
  "Autarch AI unifies 23 AI capabilities — build, research, design, media and business — in one calm enterprise workspace with projects, files and an audit trail.";

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

/** Illustrative product preview — static, no fabricated live data. */
function WorkspacePreview() {
  return (
    <div className="frame-glass overflow-hidden p-1.5">
      <div className="overflow-hidden rounded-[calc(var(--radius)+6px)] border border-border bg-background">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="size-2.5 rounded-full bg-muted-foreground/25" />
          <span className="size-2.5 rounded-full bg-muted-foreground/25" />
          <span className="size-2.5 rounded-full bg-muted-foreground/25" />
          <span className="ml-3 text-xs text-muted-foreground">Autarch workspace — preview</span>
        </div>
        <div className="grid gap-0 sm:grid-cols-[11rem_minmax(0,1fr)]">
          <div className="hidden border-r border-border p-4 sm:block">
            <div className="label-mono mb-3">Workspace</div>
            <ul className="space-y-2 text-[0.8rem] text-muted-foreground">
              {["Command center", "Projects", "Tasks", "Files", "Modules", "Usage"].map((i, n) => (
                <li key={i} className={n === 0 ? "font-medium text-foreground" : undefined}>
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5">
            <div className="text-sm text-muted-foreground">You asked</div>
            <div className="mt-2 rounded-xl bg-secondary px-4 py-3 text-[0.9rem]">
              Draft a 12-slide investor deck from our Q3 report.
            </div>
            <div className="mt-4 text-sm text-muted-foreground">Autarch routed it to</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border px-3 py-1 text-[0.78rem]">
                Presentation Builder
              </span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
              <span className="rounded-full border border-border px-3 py-1 text-[0.78rem]">Document Intelligence</span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
              <span className="rounded-full border border-border px-3 py-1 text-[0.78rem]">Saved to project</span>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {["Outline", "Slides", "Speaker notes"].map((t) => (
                <div key={t} className="rounded-lg border border-border px-3 py-6 text-center text-xs text-muted-foreground">
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const stats = [
    { k: "23", v: "AI modules in one login" },
    { k: "5", v: "clear capability groups" },
    { k: "15", v: "industry playbooks" },
    { k: "1", v: "project system & audit trail" },
  ];

  return (
    <SiteShell ambient={false}>
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pt-20 pb-16 sm:px-8 sm:pt-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 h-[46rem] hero-aurora opacity-70 dark:opacity-45"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[46rem] grid-paper opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
        />
        <div className="relative mx-auto w-full max-w-4xl text-center rise-in">
          <AutarchMark className="mx-auto h-14 w-14 shadow-lift" />
          <h1 className="mt-8 text-[2.6rem] leading-[1.05] sm:text-[4.25rem]">
            One workspace.
            <br />
            <span className="text-gradient">Every AI capability.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Describe the outcome. Autarch picks the right module, you confirm, and the result lands in your project —
            ready for the next step.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link to="/signup">Get started free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-background/70 px-7">
              <Link to="/modules">See all 23 modules</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No card needed · Availability labelled per module</p>
        </div>

        <div className="relative mx-auto mt-16 w-full max-w-5xl">
          <WorkspacePreview />
        </div>
      </section>

      {/* Stats */}
      <Section className="py-16 sm:py-16">
        <div className="grid gap-8 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.k}>
              <div className="text-3xl">{s.k}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section>
        <SectionHeader
          center
          index="How it works"
          title="Three steps, every single time"
          lead="The same rhythm across all 23 modules, so nothing new has to be learned twice."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            { n: "01", t: "Ask in plain language", d: "One prompt box. No tool picking, no menus to memorise." },
            { n: "02", t: "Confirm the module", d: "Autarch suggests the capability and shows exactly what it will do." },
            { n: "03", t: "Keep the output", d: "Results save into projects and files, reusable by any other module." },
          ].map((s) => (
            <div key={s.n} className="panel hover-lift p-7">
              <div className="label-mono">{s.n}</div>
              <h3 className="mt-4 text-xl">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Modules by category */}
      <Section>
        <SectionHeader
          center
          index="Capabilities"
          title={`${MODULES.length} modules, five simple categories`}
          lead="Pick a category, open a module. Every workspace shares the same projects, files and history."
        />

        <div className="mt-16 space-y-16">
          {MODULE_GROUPS.map((group) => {
            const mods = modulesByGroup(group.id);
            return (
              <div key={group.id} className="grid gap-8 md:grid-cols-[15rem_minmax(0,1fr)]">
                <div className="md:sticky md:top-24 md:self-start">
                  <h3 className="text-xl">{group.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{group.blurb}</p>
                  <div className="label-mono mt-4">{mods.length} modules</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {mods.map((m) => (
                    <Link
                      key={m.slug}
                      to="/app/modules/$slug"
                      params={{ slug: m.slug }}
                      className="panel hover-lift group px-5 py-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-1 text-[0.95rem] leading-snug">{m.name}</span>
                        <StatusBadge status={m.status} />
                      </div>
                      <p className="mt-1.5 text-[0.82rem] leading-relaxed text-muted-foreground">{m.tagline}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-[0.78rem] text-muted-foreground transition-colors group-hover:text-foreground">
                        Open <ArrowRight className="size-3.5" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Cross-module */}
      <Section>
        <SectionHeader
          center
          index="Cross-module"
          title="Output from one module is input to the next"
          lead="One platform, not 23 disconnected tools."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {DEMO_WORKFLOWS.map((w) => (
            <div key={w.name} className="panel p-6">
              <div className="text-[0.95rem]">{w.name}</div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.78rem] text-muted-foreground">
                {w.steps.map((s, i) => (
                  <span key={s} className="flex items-center gap-2">
                    <span className="rounded-full bg-secondary px-3 py-1">{s}</span>
                    {i < w.steps.length - 1 && <ArrowRight className="size-3" />}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Industries */}
      <Section>
        <SectionHeader
          center
          index="Industries"
          title="Fifteen working contexts"
          lead="Each context maps to specific modules, inputs and outputs — so teams know where to start."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind) => (
            <article key={ind.slug} className="panel hover-lift p-6">
              <h3 className="text-lg leading-snug">{ind.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ind.can}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {ind.modules.slice(0, 3).map((slug) => (
                  <Link
                    key={slug}
                    to="/app/modules/$slug"
                    params={{ slug }}
                    className="rounded-full border border-border px-2.5 py-1 text-[0.7rem] text-muted-foreground transition-colors hover:bg-secondary"
                  >
                    {slug}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* CTA band */}
      <Section bordered={false} className="pt-0">
        <div className="gradient-band relative overflow-hidden rounded-3xl px-8 py-20 text-center">
          <AutarchMark className="mx-auto h-12 w-12" />
          <h2 className="mt-7 text-3xl text-white sm:text-4xl">Open the command center</h2>
          <p className="mx-auto mt-4 max-w-md text-base text-white/80">
            Real capabilities run today. Everything else is clearly labelled — never faked.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="rounded-full px-7">
              <Link to="/app">Enter workspace</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/40 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
