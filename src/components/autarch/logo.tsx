import { cn } from "@/lib/utils";

/**
 * Autarch symbol — original geometric monogram: an open "A" built from two
 * rising strokes and a keystone bar, sitting inside a soft gradient tile.
 * Fully original artwork (no third-party marks), safe to reuse anywhere.
 */
export function AutarchMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-8 w-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id="autarch-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8B7CFF" />
          <stop offset="48%" stopColor="#4F7DF3" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id="autarch-stroke" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#E5E9FF" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#autarch-tile)" />
      {/* left rising stroke */}
      <path
        d="M13 35.5 24 10.5"
        fill="none"
        stroke="url(#autarch-stroke)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      {/* right stroke, deliberately shorter — the open apex */}
      <path
        d="M35 35.5 27.4 18.4"
        fill="none"
        stroke="url(#autarch-stroke)"
        strokeWidth="3.4"
        strokeLinecap="round"
        opacity="0.92"
      />
      {/* keystone bar */}
      <path d="M18.4 27.6h13.2" stroke="url(#autarch-stroke)" strokeWidth="3.2" strokeLinecap="round" />
      {/* apex node */}
      <circle cx="25.7" cy="14.2" r="2.1" fill="#ffffff" opacity="0.95" />
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
