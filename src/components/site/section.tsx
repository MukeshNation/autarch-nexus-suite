import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StrokeUnderline } from "@/components/autarch/hero-diagram";

export function SectionHeader({
  index,
  title,
  lead,
  className,
}: {
  index?: string;
  title: string;
  lead?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {index && <div className="label-mono mb-3">{index}</div>}
      <h2 className="text-2xl leading-tight sm:text-3xl">{title}</h2>
      <StrokeUnderline className="mt-2 h-3 w-40 text-border-strong" />
      {lead && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{lead}</p>}
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
    <section className={cn(bordered && "border-t border-border", "px-5 py-16 sm:px-8 sm:py-20", className)}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}
