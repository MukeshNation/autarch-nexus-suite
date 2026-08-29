import { useState } from "react";
import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Menu, Search } from "lucide-react";
import { AutarchMark } from "@/components/autarch/logo";
import { AppSidebarNav, DesktopSidebar } from "@/components/workspace/app-sidebar";
import { CommandPalette } from "@/components/workspace/command-palette";
import { DemoDataBadge } from "@/components/autarch/status-badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex" }],
  }),
  component: AppLayout,
});

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <DesktopSidebar collapsed={collapsed} setCollapsed={setCollapsed} onSearch={() => setPaletteOpen(true)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur-md sm:px-5">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Open workspace menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-14 items-center gap-2 border-b border-border px-4">
                <AutarchMark className="size-5" />
                <span className="font-mono text-[0.7rem] tracking-[0.2em] uppercase">Autarch</span>
              </div>
              <AppSidebarNav
                onNavigate={() => setDrawerOpen(false)}
                onSearch={() => {
                  setDrawerOpen(false);
                  setPaletteOpen(true);
                }}
              />
            </SheetContent>
          </Sheet>

          <Link to="/app" className="font-mono text-[0.7rem] tracking-[0.2em] uppercase md:hidden">
            Autarch
          </Link>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="ml-auto flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 font-mono text-[0.7rem] text-muted-foreground hover:bg-secondary"
          >
            <Search className="size-3.5" />
            <span className="hidden sm:inline">Search everything</span>
            <span className="hidden text-[0.62rem] sm:inline">⌘K</span>
          </button>
          <DemoDataBadge className="hidden lg:inline-flex" />
          <Button asChild variant="ghost" size="sm" className="font-mono text-[0.7rem]">
            <Link to="/">Exit</Link>
          </Button>
        </header>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
