import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/workspace/page";
import { Progress } from "@/components/ui/progress";
import { getModule } from "@/lib/modules";
import { useAccountOverview, useLedger, useUsageEvents, groupUsageByModule } from "@/lib/billing-data";

export const Route = createFileRoute("/app/usage")({
  component: UsagePage,
});

function UsagePage() {
  const overview = useAccountOverview();
  const events = useUsageEvents();
  const ledger = useLedger();

  const lines = groupUsageByModule(events.data ?? []);
  const total = lines.reduce((a, l) => a + l.credits, 0);
  const profile = overview.data?.profile ?? null;
  const subscription = overview.data?.subscription ?? null;

  return (
    <WorkspacePage
      title="Usage"
      lead="Credits are reserved atomically before a run and refunded if it fails, so concurrent requests cannot bypass your balance."
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="panel p-4">
          <span className="label-mono">Consumption by capability</span>
          {events.isLoading ? (
            <p className="mt-4 text-[0.7rem] text-muted-foreground">Loading your usage…</p>
          ) : lines.length === 0 ? (
            <p className="mt-4 text-[0.7rem] text-muted-foreground">
              No usage recorded yet. Run a capability and it will appear here.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lines.map((line) => (
                <li key={line.id}>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex-1">{getModule(line.id)?.name ?? line.id}</span>
                    <span className="text-[0.68rem] text-muted-foreground">{line.credits} cr</span>
                  </div>
                  <Progress value={total ? (line.credits / total) * 100 : 0} className="mt-1.5 h-1" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel h-fit p-4">
          <span className="label-mono">Recorded so far</span>
          <div className="mt-3 text-3xl">{total.toLocaleString()}</div>
          <p className="mt-1 text-[0.68rem] text-muted-foreground">credits consumed</p>
          <div className="mt-4 space-y-2 border-t border-border pt-3 text-[0.68rem] text-muted-foreground">
            <div className="flex justify-between">
              <span>Plan</span>
              <span>{subscription?.plan ?? profile?.plan ?? "free"}</span>
            </div>
            <div className="flex justify-between">
              <span>Balance</span>
              <span>{profile?.credit_balance ?? 0} cr</span>
            </div>
            <div className="flex justify-between">
              <span>Storage used</span>
              <span>{(((profile?.storage_used_bytes ?? 0) as number) / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          </div>
        </section>
      </div>

      <section className="panel mt-4 p-4">
        <span className="label-mono">Credit history</span>
        {ledger.isLoading ? (
          <p className="mt-3 text-[0.7rem] text-muted-foreground">Loading…</p>
        ) : (ledger.data ?? []).length === 0 ? (
          <p className="mt-3 text-[0.7rem] text-muted-foreground">No credit movements yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {(ledger.data ?? []).map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-2 text-[0.68rem]">
                <span className="text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
                <span className="flex-1">{entry.transaction_type.replace(/_/g, " ")}</span>
                {entry.reference_id && <span className="text-muted-foreground">{entry.reference_id}</span>}
                <span className={entry.amount < 0 ? "text-muted-foreground" : ""}>
                  {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                </span>
                <span className="text-muted-foreground">→ {entry.balance_after}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </WorkspacePage>
  );
}
