import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/workspace/page";
import { DemoDataBadge } from "@/components/autarch/status-badge";
import { DEMO_WORKFLOWS } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/automations")({
  component: AutomationsPage,
});

function AutomationsPage() {
  return (
    <WorkspacePage
      title="Automations"
      lead="Chain modules into a repeatable workflow with approval gates and a schedule."
      actions={<DemoDataBadge />}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {DEMO_WORKFLOWS.map((w) => (
          <article key={w.name} className="panel p-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm">{w.name}</h2>
              <span className="label-mono ml-auto">Paused</span>
            </div>
            <ol className="mt-3 space-y-1.5">
              {w.steps.map((s, i) => (
                <li key={s} className="flex items-center gap-2 rounded border border-border px-2.5 py-1.5 font-mono text-[0.68rem]">
                  <span className="text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">{s}</span>
                  <span className="label-mono">Gate</span>
                </li>
              ))}
            </ol>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" className="font-mono text-[0.7rem]">
                Edit
              </Button>
              <Button size="sm" variant="ghost" className="font-mono text-[0.7rem]">
                Schedule
              </Button>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-6 font-mono text-[0.68rem] text-muted-foreground">
        Execution runs as a background job once the job runner is connected. Every external step requires an authorized
        integration and explicit approval.
      </p>
    </WorkspacePage>
  );
}
