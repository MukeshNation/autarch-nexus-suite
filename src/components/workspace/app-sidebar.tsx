import { Link } from "@tanstack/react-router";
import {
  Home,
  Search,
  Plus,
  FolderKanban,
  CheckSquare,
  Files,
  Boxes,
  Workflow,
  Plug,
  History,
  Gauge,
  CreditCard,
  Bell,
  Settings,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { AutarchMark } from "@/components/autarch/logo";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const SIDEBAR_ITEMS = [
  { label: "Home", to: "/app" as const, icon: Home },
  { label: "New Project", to: "/app/projects" as const, icon: Plus },
  { label: "Projects", to: "/app/projects" as const, icon: FolderKanban },
  { label: "Tasks", to: "/app/tasks" as const, icon: CheckSquare },
  { label: "Files", to: "/app/files" as const, icon: Files },
  { label: "AI Modules", to: "/app/modules" as const, icon: Boxes },
  { label: "Automations", to: "/app/automations" as const, icon: Workflow },
  { label: "Integrations", to: "/app/integrations" as const, icon: Plug },
  { label: "History", to: "/app/history" as const, icon: History },
  { label: "Usage", to: "/app/usage" as const, icon: Gauge },
  { label: "Billing", to: "/app/billing" as const, icon: CreditCard },
  { label: "Notifications", to: "/app/notifications" as const, icon: Bell },
  { label: "Settings", to: "/app/settings" as const, icon: Settings },
];

export function AppSidebarNav({
  collapsed = false,
  onNavigate,
  onSearch,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  onSearch: () => void;
}) {
  const { isAdmin } = useAuth();
  const items = isAdmin
    ? [...SIDEBAR_ITEMS, { label: "Admin", to: "/admin" as const, icon: ShieldCheck }]
    : SIDEBAR_ITEMS;
  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3">
      <button
        type="button"
        onClick={onSearch}
        className={cn(
          "mb-2 flex w-full items-center gap-2.5 rounded-md border border-border px-2.5 py-2 text-left font-mono text-xs text-muted-foreground transition-colors hover:bg-secondary",
          collapsed && "justify-center px-0",
        )}
      >
        <Search className="size-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">Search</span>
            <span className="text-[0.62rem]">⌘K</span>
          </>
        )}
      </button>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              to={item.to}
              onClick={onNavigate}
              activeOptions={{ exact: item.to === "/app" }}
              activeProps={{ className: "bg-secondary text-foreground" }}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 font-mono text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
              title={item.label}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function DesktopSidebar({
  collapsed,
  setCollapsed,
  onSearch,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onSearch: () => void;
}) {
  const { isAdmin } = useAuth();
  const items = isAdmin
    ? [...SIDEBAR_ITEMS, { label: "Admin", to: "/admin" as const, icon: ShieldCheck }]
    : SIDEBAR_ITEMS;
  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 md:flex",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div className={cn("flex h-14 items-center gap-2 border-b border-border px-3", collapsed && "justify-center px-0")}>
        <Link to="/app" className="flex items-center gap-2">
          <AutarchMark className="size-5" />
          {!collapsed && <span className="font-mono text-[0.7rem] tracking-[0.2em] uppercase">Autarch</span>}
        </Link>
      </div>
      <AppSidebarNav collapsed={collapsed} onSearch={onSearch} />
      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 font-mono text-[0.7rem] text-muted-foreground hover:bg-secondary",
            collapsed && "justify-center px-0",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
