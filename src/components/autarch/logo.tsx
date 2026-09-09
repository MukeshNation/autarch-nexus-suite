import { cn } from "@/lib/utils";

export function AutarchMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-6 w-6", className)} aria-hidden="true">
      <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M8 23 16 8l8 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11.5 18h9" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="16" cy="8" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function AutarchWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <AutarchMark />
      <span className="text-[0.9rem] font-medium tracking-[0.22em] uppercase">Autarch AI</span>
    </span>
  );
}
