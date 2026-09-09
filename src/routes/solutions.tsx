import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/site-shell";
import { Section, SectionHeader } from "@/components/site/section";
import { INDUSTRIES } from "@/lib/industries";
import { Button } from "@/components/ui/button";

const TITLE = "Solutions — Autarch AI across 15 industries";
const DESC =
  "Software engineering, legal auditing, research, automation, marketing, media, finance, localisation and more — each mapped to specific Autarch modules.";

export const Route = createFileRoute("/solutions")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: SolutionsPage,
});

function SolutionsPage() {
  return (
    <SiteShell>
      <Section bordered={false}>
        <SectionHeader
          index="Solutions"
          title="Fifteen working contexts, one workspace"
          lead="Every context lists what Autarch can do, which modules it uses, the workflow, and what goes in and out."
        />
      </Section>
      {INDUSTRIES.map((ind) => (
        <Section key={ind.slug}>
          <div className="grid gap-6 lg:grid-cols-[7rem_minmax(0,1fr)]">
            <div className="label-mono lg:pt-1.5">{ind.id}</div>
            <div>
              <h2 className="text-xl sm:text-2xl">{ind.name}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{ind.can}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Modules", ind.modules.join(" · ")],
                  ["Example workflow", ind.workflow.join(" → ")],
                  ["Input types", ind.inputs.join(" · ")],
                  ["Outputs", ind.outputs.join(" · ")],
                ].map(([k, v]) => (
                  <div key={k} className="panel p-4">
                    <div className="label-mono">{k}</div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {ind.modules.map((slug) => (
                  <Button key={slug} asChild size="sm" variant="outline" className="text-xs">
                    <Link to="/app/modules/$slug" params={{ slug }}>
                      Open {slug}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Section>
      ))}
    </SiteShell>
  );
}
