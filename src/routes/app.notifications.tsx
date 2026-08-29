import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/workspace/page";
import { DemoDataBadge } from "@/components/autarch/status-badge";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsPage,
});

const ITEMS = [
  { title: "Contract review finished", detail: "12 clauses extracted · 3 flagged", when: "8m ago" },
  { title: "Video dubbing job queued", detail: "Awaiting compute capacity", when: "22m ago" },
  { title: "Approval required", detail: "Outreach sequence step 2 needs sign-off", when: "1h ago" },
  { title: "Credit checkpoint", detail: "60% of period allowance consumed", when: "Yesterday" },
];

function NotificationsPage() {
  return (
    <WorkspacePage title="Notifications" lead="Job results, approvals and account events." actions={<DemoDataBadge />}>
      <ul className="panel divide-y divide-border">
        {ITEMS.map((n) => (
          <li key={n.title} className="flex items-start gap-3 px-4 py-3">
            <span className="mt-1.5 size-1.5 rounded-full bg-foreground" />
            <div className="min-w-0 flex-1">
              <span className="block text-xs">{n.title}</span>
              <span className="block text-[0.7rem] text-muted-foreground">{n.detail}</span>
            </div>
            <span className="label-mono">{n.when}</span>
          </li>
        ))}
      </ul>
    </WorkspacePage>
  );
}
