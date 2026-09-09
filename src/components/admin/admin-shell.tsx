import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AutarchWordmark } from "@/components/autarch/logo";
import { ThemeToggle } from "@/components/autarch/theme-toggle";
import { useAuth } from "@/hooks/use-auth";

const TABS = [
  { to: "/admin", label: "Console" },
  { to: "/admin/providers", label: "AI providers" },
  { to: "/admin/modules", label: "Modules" },
  { to: "/admin/payments", label: "Payments" },
] as const;

export function AdminShell({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: ReactNode;
}) {
  const { loading, isAdmin } = useAuth();

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-3">
          <AutarchWordmark />
          <span className="label-mono">Owner control</span>
          <nav className="ml-auto flex flex-wrap items-center gap-1">
            {TABS.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className="rounded-md px-2.5 py-1.5 text-[0.7rem] text-muted-foreground hover:bg-secondary hover:text-foreground [&.active]:bg-secondary [&.active]:text-foreground"
              >
                {t.label}
              </Link>
            ))}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{lead}</p>

        {loading ? (
          <p className="mt-10 label-mono">Checking access…</p>
        ) : !isAdmin ? (
          <p className="mt-10 rounded-lg border border-border bg-secondary/40 p-6 text-sm">
            This area is restricted to administrators. Every action here is also verified on the server.
          </p>
        ) : (
          <div className="mt-8 space-y-8">{children}</div>
        )}
      </main>
    </div>
  );
}
