import { Link } from "@tanstack/react-router";
import { AutarchWordmark } from "@/components/autarch/logo";
import { MODULE_GROUPS } from "@/lib/modules";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-5 py-12 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <AutarchWordmark />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            One enterprise AI workspace. Twenty-three capabilities, one project system, one audit trail.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="label-mono mb-3">Platform</div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/product" className="hover:underline">
                  Product
                </Link>
              </li>
              <li>
                <Link to="/modules" className="hover:underline">
                  AI Modules
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:underline">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/security" className="hover:underline">
                  Security
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="label-mono mb-3">Capability groups</div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {MODULE_GROUPS.map((g) => (
                <li key={g.id}>{g.name}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="label-mono mb-3">Company</div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/company" className="hover:underline">
                  About
                </Link>
              </li>
              <li>
                <Link to="/resources" className="hover:underline">
                  Resources
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:underline">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/solutions" className="hover:underline">
                  Solutions
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 w-full max-w-6xl border-t border-border pt-5 text-[0.68rem] text-muted-foreground">
        © 2026 Autarch AI · Phase 1 product shell. Capability availability is labelled per module; nothing here claims a
        live third-party connection.
      </div>
    </footer>
  );
}
