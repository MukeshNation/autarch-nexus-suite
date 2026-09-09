import { cn } from "@/lib/utils";

/**
 * Autarch symbol — a soft gradient tile with a geometric "A" aperture.
 * Swap the inner <path> later to drop in a custom brand symbol.
 */
export function AutarchMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id="autarch-mark-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C6CF6" />
          <stop offset="55%" stopColor="#5B8DEF" />
          <stop offset="100%" stopColor="#9B6BF2" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#autarch-mark-g)" />
      <path d="M12.5 28 20 11.5 27.5 28" fill="none" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M16.4 22.6h7.2" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function AutarchWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <AutarchMark className="h-7 w-7" />
      <span className="text-[1.05rem] font-semibold tracking-[-0.02em]">
        Autarch<span className="text-muted-foreground"> AI</span>
      </span>
    </span>
  );
}
