import { createFileRoute, Link } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/workspace/page";
import { MODULE_GROUPS, modulesByGroup } from "@/lib/modules";
import { StatusBadge } from "@/components/autarch/status-badge";

export const Route = createFileRoute("/app/modules/")({
  component: ModuleDirectory,
});

function ModuleDirectory() {
  return (
    <WorkspacePage
      title="AI Modules"
      lead="Twenty-three capabilities, grouped. Each opens its own specialized workspace and shares your projects and files."
    >
      <div className="space-y-8">
        {MODULE_GROUPS.map((group) => (
          <section key={group.id}>
            <div className="flex items-baseline gap-2">
              <span className="label-mono">{group.name}</span>
              <span className="text-[0.7rem] text-muted-foreground">{group.blurb}</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {modulesByGroup(group.id).map((m) => (
                <Link
                  key={m.slug}
                  to="/app/modules/$slug"
                  params={{ slug: m.slug }}
                  className="panel hover-lift p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[0.62rem] text-muted-foreground">{m.id}</span>
                    <StatusBadge status={m.status} className="ml-auto" />
                  </div>
                  <h2 className="mt-2 text-sm leading-snug">{m.name}</h2>
                  <p className="mt-1 text-[0.68rem] text-muted-foreground">{m.tagline}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </WorkspacePage>
  );
}
