import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/workspace/page";
import { DemoDataBadge } from "@/components/autarch/status-badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/app/usage")({
  component: UsagePage,
});

const LINES = [
  ["Document intelligence", 1240],
  ["Image generation", 860],
  ["Translation & dubbing", 640],
  ["Software builder", 410],
  ["Research", 300],
];

function UsagePage() {
  const total = LINES.reduce((a, [, v]) => a + (v as number), 0);

  return (
    <WorkspacePage
      title="Usage"
      lead="Credits are reserved before a run, recorded during it, and finalised after — concurrent requests cannot bypass your limit."
      actions={<DemoDataBadge />}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="panel p-4">
          <span className="label-mono">Consumption by capability</span>
          <ul className="mt-4 space-y-3">
            {LINES.map(([name, value]) => (
              <li key={name as string}>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex-1">{name}</span>
                  <span className="font-mono text-[0.68rem] text-muted-foreground">{value} cr</span>
                </div>
                <Progress value={((value as number) / total) * 100} className="mt-1.5 h-1" />
              </li>
            ))}
          </ul>
        </section>
        <section className="panel h-fit p-4">
          <span className="label-mono">This period</span>
          <div className="mt-3 font-mono text-3xl">{total.toLocaleString()}</div>
          <p className="mt-1 font-mono text-[0.68rem] text-muted-foreground">credits consumed</p>
          <div className="mt-4 space-y-2 border-t border-border pt-3 font-mono text-[0.68rem] text-muted-foreground">
            <div className="flex justify-between">
              <span>Plan</span>
              <span>Pro</span>
            </div>
            <div className="flex justify-between">
              <span>Allowance</span>
              <span>defined monthly</span>
            </div>
            <div className="flex justify-between">
              <span>Storage</span>
              <span>defined</span>
            </div>
          </div>
        </section>
      </div>
    </WorkspacePage>
  );
}
