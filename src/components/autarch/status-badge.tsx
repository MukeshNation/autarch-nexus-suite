import { STATUS_TONE, type ModuleStatus } from "@/lib/modules";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: ModuleStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] tracking-[0.14em] uppercase",
        STATUS_TONE[status],
        className,
      )}
    >
      {status}
    </span>
  );
}

export function DemoDataBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dashed border-border-strong px-2 py-0.5 text-[0.625rem] tracking-[0.14em] text-muted-foreground uppercase",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-sand pulse-dot" />
      Demo data
    </span>
  );
}
