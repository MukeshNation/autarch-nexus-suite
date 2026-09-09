import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/site-shell";
import { Section, SectionHeader } from "@/components/site/section";
import { MODULE_GROUPS, modulesByGroup } from "@/lib/modules";
import { StatusBadge } from "@/components/autarch/status-badge";

const TITLE = "AI Modules — all 23 Autarch capabilities";
const DESC =
  "Browse every Autarch AI module: software building, research, legal intelligence, image and video studios, voice, dubbing, analytics and automation.";

export const Route = createFileRoute("/modules")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: ModulesPage,
});

function ModulesPage() {
  return (
    <SiteShell>
      <Section bordered={false}>
        <SectionHeader
          index="Directory"
          title="All 23 Autarch capabilities"
          lead="Each module opens its own specialized workspace. Availability labels are honest: nothing is presented as live until it is."
        />
      </Section>
      {MODULE_GROUPS.map((group) => (
        <Section key={group.id}>
          <div className="label-mono">{group.name}</div>
          <p className="mt-1 text-sm text-muted-foreground">{group.blurb}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modulesByGroup(group.id).map((m) => (
              <Link
                key={m.slug}
                to="/app/modules/$slug"
                params={{ slug: m.slug }}
                className="panel hover-lift flex flex-col p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[0.65rem] text-muted-foreground">{m.id}</span>
                  <StatusBadge status={m.status} className="ml-auto" />
                </div>
                <h3 className="mt-2 text-base leading-snug">{m.name}</h3>
                <p className="mt-1.5 text-[0.7rem] text-muted-foreground">{m.tagline}</p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{m.summary}</p>
                <div className="mt-4 flex flex-wrap gap-1.5 text-[0.62rem] text-muted-foreground">
                  {m.outputs.slice(0, 3).map((o) => (
                    <span key={o} className="rounded border border-border px-1.5 py-0.5">
                      {o}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </Section>
      ))}
    </SiteShell>
  );
}
