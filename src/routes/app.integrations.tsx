import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/workspace/page";
import { DEMO_INTEGRATIONS } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/integrations")({
  component: IntegrationsPage,
});

function IntegrationsPage() {
  return (
    <WorkspacePage
      title="Integrations"
      lead="Connected accounts authorize Autarch to act on your behalf. Nothing connects without an explicit OAuth grant."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_INTEGRATIONS.map((i) => (
          <article key={i.name} className="panel p-4">
            <div className="flex items-center gap-2">
              <span className="label-mono">{i.category}</span>
              <span className="label-mono ml-auto">{i.status}</span>
            </div>
            <h2 className="mt-2 text-sm">{i.name}</h2>
            <Button size="sm" variant="outline" className="mt-3 w-full text-[0.7rem]">
              Connect
            </Button>
          </article>
        ))}
      </div>
      <p className="mt-6 max-w-2xl text-[0.68rem] leading-relaxed text-muted-foreground">
        Statuses: Connected · Disconnected · Expired · Error. Autarch uses authorized provider APIs only and never asks
        for a password to a third-party service.
      </p>
    </WorkspacePage>
  );
}
