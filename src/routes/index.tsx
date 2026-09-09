import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/site-shell";
import { Section, SectionHeader } from "@/components/site/section";
import { Composer } from "@/components/autarch/composer";
import { StatusBadge } from "@/components/autarch/status-badge";
import { MODULE_GROUPS, modulesByGroup } from "@/lib/modules";
import { INDUSTRIES } from "@/lib/industries";
import { DEMO_WORKFLOWS } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";

const TITLE = "Autarch AI — Every industrial AI tool in one workspace";
const DESC =
  "Autarch AI unifies 23 AI capabilities — build, research, design, media and business — inside one calm enterprise workspace with projects, files and an audit trail.";

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
      {/* Hero */}
      <section className="px-5 pt-24 pb-16 text-center sm:px-8 sm:pt-32">
        <div className="mx-auto w-full max-w-3xl rise-in">
          <div className="label-mono mb-6">One workspace · 23 capabilities</div>
          <h1 className="text-4xl leading-[1.08] sm:text-6xl">Autarch AI</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Every industrial AI capability, in one calm enterprise workspace. Ask once — Autarch picks the right
            capability, you confirm, and the result lands in your project.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link to="/signup">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <Link to="/modules">Explore the 23 modules</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 w-full max-w-2xl text-left">
          <Composer />
        </div>
      </section>

      {/* Categories */}
      <Section>
        <SectionHeader
          center
          index="Capabilities"
          title="23 modules, five simple categories"
          lead="Nothing to decode. Pick a category, open a module, and every workspace shares the same projects, files and history."
        />

        <div className="mt-16 space-y-16">
          {MODULE_GROUPS.map((group) => {
            const mods = modulesByGroup(group.id);
            return (
              <div key={group.id} className="grid gap-8 md:grid-cols-[16rem_minmax(0,1fr)]">
                <div className="md:pt-1">
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
                      className="panel hover-lift px-5 py-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-1 text-[0.95rem] leading-snug">{m.name}</span>
                        <StatusBadge status={m.status} />
                      </div>
                      <p className="mt-1.5 text-[0.82rem] leading-relaxed text-muted-foreground">{m.tagline}</p>
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
          lead="One platform, not 23 tools. Anything generated can be saved to a project and reused anywhere else."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {DEMO_WORKFLOWS.map((w) => (
            <div key={w.name} className="panel p-6">
              <div className="text-[0.95rem]">{w.name}</div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.78rem] text-muted-foreground">
                {w.steps.map((s, i) => (
                  <span key={s} className="flex items-center gap-2">
                    <span className="rounded-full bg-secondary px-3 py-1">{s}</span>
                    {i < w.steps.length - 1 && <span aria-hidden="true">→</span>}
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
          lead="Each context maps to specific modules, inputs and outputs — so teams know exactly where to start."
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

      {/* CTA */}
      <Section className="text-center">
        <h2 className="text-3xl sm:text-4xl">Open the command center</h2>
        <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
          Availability is labelled honestly per module — real capabilities run today, the rest are clearly marked.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="rounded-full px-7">
            <Link to="/app">Enter workspace</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-7">
            <Link to="/pricing">See pricing</Link>
          </Button>
        </div>
      </Section>
    </SiteShell>
  );
}
