import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ChevronDown } from "lucide-react";
import { AutarchWordmark } from "@/components/autarch/logo";
import { MODULE_GROUPS, modulesByGroup } from "@/lib/modules";
import { StatusBadge } from "@/components/autarch/status-badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { label: "Product", to: "/product" },
  { label: "Solutions", to: "/solutions" },
  { label: "Pricing", to: "/pricing" },
  { label: "Resources", to: "/resources" },
  { label: "Company", to: "/company" },
  { label: "Security", to: "/security" },
] as const;

function MegaMenu() {
  return (
    <div className="absolute top-full left-0 hidden w-full pt-3 group-hover:block group-focus-within:block">
      <div className="panel mx-auto grid w-full max-w-6xl gap-6 p-6 shadow-lift md:grid-cols-3 lg:grid-cols-5">
        {MODULE_GROUPS.map((group) => (
          <div key={group.id}>
            <div className="label-mono">{group.name}</div>
            <p className="mt-1 mb-3 text-[0.72rem] leading-snug text-muted-foreground">{group.blurb}</p>
            <ul className="space-y-1.5">
              {modulesByGroup(group.id).map((m) => (
                <li key={m.slug}>
                  <Link
                    to="/app/modules/$slug"
                    params={{ slug: m.slug }}
                    className="group/i block rounded-md px-2 py-1.5 transition-colors hover:bg-secondary"
                  >
                    <span className="flex items-baseline gap-1.5">
                      <span className="font-mono text-[0.65rem] text-muted-foreground">{m.id}</span>
                      <span className="text-[0.8rem] leading-snug">{m.name}</span>
                    </span>
                    <StatusBadge status={m.status} className="mt-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="lg:col-span-5 lg:border-t lg:border-border lg:pt-4">
          <Link to="/modules" className="font-mono text-xs underline underline-offset-4">
            View all 23 capabilities →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link to="/" className="shrink-0">
          <AutarchWordmark />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <Link
            to="/product"
            className="rounded-md px-3 py-2 font-mono text-xs tracking-wide transition-colors hover:bg-secondary"
          >
            Product
          </Link>
          <div className="group relative">
            <Link
              to="/modules"
              className="flex items-center gap-1 rounded-md px-3 py-2 font-mono text-xs tracking-wide transition-colors hover:bg-secondary"
            >
              AI Modules <ChevronDown className="size-3" />
            </Link>
            <MegaMenu />
          </div>
          {NAV.slice(1).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 font-mono text-xs tracking-wide transition-colors hover:bg-secondary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden font-mono text-xs sm:inline-flex">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="font-mono text-xs">
            <Link to="/signup">Get started</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                {open ? <X className="size-4" /> : <Menu className="size-4" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[19rem] overflow-y-auto p-0">
              <div className="border-b border-border px-5 py-4">
                <AutarchWordmark />
              </div>
              <nav className="px-5 py-4">
                <ul className="space-y-1">
                  {[{ label: "AI Modules", to: "/modules" }, ...NAV, { label: "Contact", to: "/contact" }].map(
                    (item) => (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          onClick={() => setOpen(false)}
                          className="block rounded-md px-2 py-2 font-mono text-sm hover:bg-secondary"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
                <div className="mt-5 border-t border-border pt-4">
                  <div className="label-mono mb-2">Workspace</div>
                  <Link
                    to="/app"
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-2 py-2 font-mono text-sm hover:bg-secondary"
                  >
                    Open command center
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
