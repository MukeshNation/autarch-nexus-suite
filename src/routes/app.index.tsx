import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Composer } from "@/components/autarch/composer";
import { WorkspacePage } from "@/components/workspace/page";
import { StatusBadge, DemoDataBadge } from "@/components/autarch/status-badge";
import { DEMO_PROJECTS, DEMO_GENERATIONS, DEMO_WORKFLOWS } from "@/lib/demo-data";
import { MODULES, getModule } from "@/lib/modules";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const FAVOURITES = ["assistant", "document-intelligence", "image-studio", "presentation-builder"];

function Dashboard() {
  return (
    <WorkspacePage
      title="What do you want Autarch to do?"
      lead="Describe the outcome. Autarch recommends a capability, you confirm, and the result lands in your project."
      actions={<DemoDataBadge />}
    >
      <Composer className="mx-auto max-w-3xl" />

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <section className="panel p-4 lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="label-mono">Recent projects</span>
            <Link to="/app/projects" className="ml-auto font-mono text-[0.68rem] underline underline-offset-4">
              All projects
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {DEMO_PROJECTS.map((p) => (
              <li key={p.id} className="py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{p.name}</span>
                  <span className="label-mono ml-auto">{p.category}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                <div className="mt-2 flex items-center gap-3">
                  <Progress value={p.progress} className="h-1 flex-1" />
                  <span className="font-mono text-[0.65rem] text-muted-foreground">{p.progress}%</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-4">
          <span className="label-mono">Continue working</span>
          <ul className="mt-3 space-y-2">
            {DEMO_GENERATIONS.slice(0, 3).map((g) => {
              const m = getModule(g.module);
              return (
                <li key={g.title}>
                  <Link
                    to="/app/modules/$slug"
                    params={{ slug: g.module }}
                    className="hover-lift block rounded-md border border-border px-3 py-2"
                  >
                    <span className="block text-xs">{g.title}</span>
                    <span className="label-mono mt-1 block">
                      {m?.name} · {g.when}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="panel p-4">
          <span className="label-mono">Recent generations</span>
          <ul className="mt-3 divide-y divide-border">
            {DEMO_GENERATIONS.map((g) => (
              <li key={g.title} className="flex items-center gap-2 py-2 text-xs">
                <span className="flex-1 truncate">{g.title}</span>
                <span className="label-mono">{g.when}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-4">
          <div className="flex items-center gap-2">
            <span className="label-mono">Favorite modules</span>
            <Link to="/app/modules" className="ml-auto font-mono text-[0.68rem] underline underline-offset-4">
              All 23
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {FAVOURITES.map((slug) => {
              const m = MODULES.find((x) => x.slug === slug)!;
              return (
                <li key={slug}>
                  <Link
                    to="/app/modules/$slug"
                    params={{ slug }}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-secondary"
                  >
                    <span className="font-mono text-[0.62rem] text-muted-foreground">{m.id}</span>
                    <span className="flex-1 truncate">{m.name}</span>
                    <StatusBadge status={m.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel p-4">
          <span className="label-mono">Suggested workflows</span>
          <ul className="mt-3 space-y-2">
            {DEMO_WORKFLOWS.map((w) => (
              <li key={w.name} className="rounded-md border border-border px-3 py-2">
                <span className="block text-xs">{w.name}</span>
                <div className="mt-1.5 flex flex-wrap items-center gap-1 font-mono text-[0.6rem] text-muted-foreground">
                  {w.steps.map((s, i) => (
                    <span key={s} className="flex items-center gap-1">
                      {s}
                      {i < w.steps.length - 1 && <ArrowRight className="size-2.5" />}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </WorkspacePage>
  );
}
