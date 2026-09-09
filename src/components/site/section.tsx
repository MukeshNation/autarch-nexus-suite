import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  index,
  title,
  lead,
  className,
  center,
}: {
  index?: string;
  title: string;
  lead?: string;
  className?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center", className)}>
      {index && <div className="label-mono mb-4">{index}</div>}
      <h2 className="text-3xl leading-[1.15] sm:text-4xl">{title}</h2>
      {lead && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{lead}</p>}
    </div>
  );
}

export function Section({
  children,
  className,
  bordered = true,
}: {
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <section className={cn(bordered && "border-t border-border", "px-5 py-24 sm:px-8 sm:py-28", className)}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}
