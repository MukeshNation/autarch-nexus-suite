import type { ReactNode } from "react";
import { SiteNav } from "./site-nav";
import { SiteFooter } from "./site-footer";

export function SiteShell({ children, ambient = true }: { children: ReactNode; ambient?: boolean }) {
  return (
    <div className="relative min-h-screen bg-background">
      {ambient && (
        <>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] ambient-mist" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] grid-paper opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
          />
        </>
      )}
      <div className="relative">
        <SiteNav />
        <main>{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
