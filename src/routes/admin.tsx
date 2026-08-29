import { createFileRoute, Link } from "@tanstack/react-router";
import { MODULES } from "@/lib/modules";
import { DEMO_JOBS } from "@/lib/demo-data";
import { AutarchWordmark } from "@/components/autarch/logo";
import { StatusBadge } from "@/components/autarch/status-badge";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Autarch AI" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Internal Autarch AI operations view." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="min-h-svh bg-background">
      <header className="flex items-center gap-3 border-b border-border px-5 py-3">
        <AutarchWordmark />
        <span className="label-mono">Admin</span>
        <Link to="/app" className="label-mono ml-auto hover:text-foreground">
          Back to workspace
        </Link>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-5 py-8">
        <p className="max-w-2xl text-xs text-muted-foreground">
          Operations surface for capability status, job health and provider routing. Access is restricted to workspace
          administrators through a server-side role check once accounts are connected.
        </p>

        <section className="panel p-4">
          <span className="label-mono">Capability status</span>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {MODULES.map((m) => (
              <li key={m.slug} className="flex items-center gap-2 rounded border border-border px-2.5 py-1.5">
                <span className="min-w-0 flex-1 truncate text-xs">{m.name}</span>
                <StatusBadge status={m.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-4">
          <span className="label-mono">Job queue</span>
          <ul className="mt-3 space-y-1.5 font-mono text-[0.7rem] text-muted-foreground">
            {DEMO_JOBS.map((j) => (
              <li key={j.id} className="flex gap-2">
                <span>{j.id}</span>
                <span className="flex-1 truncate">{j.label}</span>
                <span>{j.state}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
