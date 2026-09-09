import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/workspace/page";
import { DemoDataBadge } from "@/components/autarch/status-badge";
import { DEMO_JOBS, DEMO_GENERATIONS } from "@/lib/demo-data";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/app/history")({
  component: HistoryPage,
});

function HistoryPage() {
  return (
    <WorkspacePage
      title="History"
      lead="Every run, its state and its output. Long jobs continue even if you close the browser."
      actions={<DemoDataBadge />}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-4">
          <span className="label-mono">Jobs</span>
          <ul className="mt-3 space-y-3">
            {DEMO_JOBS.map((j) => (
              <li key={j.id}>
                <div className="flex items-center gap-2">
                  <span className="text-[0.68rem] text-muted-foreground">{j.id}</span>
                  <span className="flex-1 truncate text-xs">{j.label}</span>
                  <span className="label-mono">{j.state}</span>
                </div>
                <Progress value={j.progress} className="mt-1.5 h-1" />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[0.62rem] text-muted-foreground">
            States: Queued · Processing · Completed · Failed · Cancelled
          </p>
        </section>

        <section className="panel p-4">
          <span className="label-mono">Generations</span>
          <ul className="mt-3 divide-y divide-border">
            {DEMO_GENERATIONS.map((g) => (
              <li key={g.title} className="flex items-center gap-2 py-2.5 text-xs">
                <span className="min-w-0 flex-1 truncate">{g.title}</span>
                <span className="label-mono">{g.module}</span>
                <span className="label-mono">{g.when}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </WorkspacePage>
  );
}
