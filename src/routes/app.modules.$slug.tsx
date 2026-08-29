import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Download, FolderPlus, Info, Share2 } from "lucide-react";
import { WorkspacePage } from "@/components/workspace/page";
import { ModulePanel } from "@/components/workspace/panels";
import { StatusBadge } from "@/components/autarch/status-badge";
import { getModule, MODULES } from "@/lib/modules";
import { DEMO_PROJECTS } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/modules/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  loader: ({ params }) => {
    const mod = getModule(params.slug);
    if (!mod) throw notFound();
    return { slug: mod.slug };
  },
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: ModuleWorkspace,
});

function ModuleWorkspace() {
  const { slug } = Route.useParams();
  const { q } = Route.useSearch();
  const mod = getModule(slug)!;
  const related = MODULES.filter((m) => m.group === mod.group && m.slug !== mod.slug).slice(0, 3);

  return (
    <WorkspacePage
      title={mod.name}
      lead={mod.summary}
      actions={
        <>
          <StatusBadge status={mod.status} />
          <Button size="sm" variant="outline" className="gap-1.5 font-mono text-[0.7rem]">
            <FolderPlus className="size-3.5" /> Save to project
          </Button>
          <Button size="sm" variant="ghost" className="gap-1.5 font-mono text-[0.7rem]">
            <Download className="size-3.5" /> Export
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border py-2.5">
        <span className="label-mono">{mod.id}</span>
        <span className="font-mono text-[0.7rem] text-muted-foreground">{mod.tagline}</span>
        <span className="label-mono ml-auto">
          Project: {DEMO_PROJECTS[0]!.name}
        </span>
      </div>

      {mod.notice && (
        <p className="mt-4 flex gap-2 rounded-md border border-dashed border-border-strong px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {mod.notice}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-1.5 font-mono text-[0.65rem] text-muted-foreground">
        {mod.workflow.map((step, i) => (
          <span key={step} className="flex items-center gap-1.5">
            <span className="rounded-full border border-border px-2 py-0.5">{step}</span>
            {i < mod.workflow.length - 1 && <span>→</span>}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)_minmax(0,0.9fr)]">
        <div className="space-y-4">
          {mod.layout.left.map((panel) => (
            <ModulePanel key={panel.title} panel={panel} request={q} />
          ))}
        </div>
        <div className="space-y-4">
          {mod.layout.main.map((panel) => (
            <ModulePanel key={panel.title} panel={panel} request={q} />
          ))}
        </div>
        <div className="space-y-4">
          {mod.layout.right.map((panel) => (
            <ModulePanel key={panel.title} panel={panel} request={q} />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="panel p-4">
          <span className="label-mono">Input types</span>
          <p className="mt-2 text-xs text-muted-foreground">{mod.inputs.join(" · ")}</p>
        </div>
        <div className="panel p-4">
          <span className="label-mono">Outputs</span>
          <p className="mt-2 text-xs text-muted-foreground">{mod.outputs.join(" · ")}</p>
        </div>
        <div className="panel p-4">
          <span className="label-mono flex items-center gap-1.5">
            <Share2 className="size-3" /> Use in another module
          </span>
          <ul className="mt-2 space-y-1.5">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  to="/app/modules/$slug"
                  params={{ slug: r.slug }}
                  className="block truncate rounded px-1.5 py-1 text-xs hover:bg-secondary"
                >
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </WorkspacePage>
  );
}
