/** Animated technical line illustration: an Autarch workflow drawn in strokes. */
export function HeroDiagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 320"
      className={className}
      fill="none"
      stroke="currentColor"
      aria-label="Autarch workflow diagram: request, capability routing, execution, project"
    >
      <g strokeWidth="1" opacity="0.55">
        <rect x="12" y="120" width="150" height="72" rx="6" className="stroke-draw" />
        <rect x="372" y="42" width="150" height="60" rx="6" className="stroke-draw" />
        <rect x="372" y="130" width="150" height="60" rx="6" className="stroke-draw" />
        <rect x="372" y="218" width="150" height="60" rx="6" className="stroke-draw" />
        <rect x="732" y="120" width="150" height="72" rx="6" className="stroke-draw" />
        <circle cx="267" cy="156" r="26" className="stroke-draw" />
      </g>

      <g strokeWidth="1" opacity="0.7">
        <path d="M162 156h79" className="flow-line" />
        <path d="M293 156h79M293 148c40-40 40-70 79-76M293 164c40 40 40 70 79 76" className="flow-line" />
        <path d="M522 72h100c22 0 26 40 48 46M522 160h190M522 248h100c22 0 26-40 48-46" className="flow-line" />
      </g>

      <g fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.6" fill="currentColor" stroke="none" opacity="0.8">
        <text x="28" y="152">REQUEST</text>
        <text x="28" y="172" opacity="0.55">natural language</text>
        <text x="248" y="160">ROUTE</text>
        <text x="390" y="70">RESEARCH</text>
        <text x="390" y="88" opacity="0.55">cited sources</text>
        <text x="390" y="158">GENERATE</text>
        <text x="390" y="176" opacity="0.55">deck · image · code</text>
        <text x="390" y="246">EXECUTE</text>
        <text x="390" y="264" opacity="0.55">gated actions</text>
        <text x="750" y="152">PROJECT</text>
        <text x="750" y="172" opacity="0.55">files · tasks · history</text>
      </g>

      <g stroke="none" fill="currentColor">
        <circle cx="267" cy="156" r="2.5" className="pulse-dot" />
        <circle cx="722" cy="156" r="2.5" className="pulse-dot" />
        <circle cx="172" cy="156" r="2.5" className="pulse-dot" />
      </g>
    </svg>
  );
}

/** Small decorative pen-stroke underline used under section headings. */
export function StrokeUnderline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 12" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M2 8c34-6 72-7 108-4 34 3 70 1 108-4" strokeWidth="1.5" className="stroke-draw" />
    </svg>
  );
}
