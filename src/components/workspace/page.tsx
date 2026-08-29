import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function WorkspacePage({
  title,
  lead,
  actions,
  children,
  className,
}: {
  title: string;
  lead?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-4 py-6 sm:px-6 sm:py-8", className)}>
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl">{title}</h1>
            {lead && <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">{lead}</p>}
          </div>
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
