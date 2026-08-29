import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MODULES } from "@/lib/modules";
import { DEMO_PROJECTS } from "@/lib/demo-data";

const PAGES = [
  { label: "Home dashboard", to: "/app" as const },
  { label: "Projects", to: "/app/projects" as const },
  { label: "Tasks", to: "/app/tasks" as const },
  { label: "Files", to: "/app/files" as const },
  { label: "AI Modules", to: "/app/modules" as const },
  { label: "Automations", to: "/app/automations" as const },
  { label: "Integrations", to: "/app/integrations" as const },
  { label: "History", to: "/app/history" as const },
  { label: "Usage", to: "/app/usage" as const },
  { label: "Billing", to: "/app/billing" as const },
  { label: "Notifications", to: "/app/notifications" as const },
  { label: "Settings", to: "/app/settings" as const },
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search modules, projects and pages…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>
        <CommandGroup heading="Capabilities">
          {MODULES.map((m) => (
            <CommandItem
              key={m.slug}
              value={`${m.id} ${m.name} ${m.tagline}`}
              onSelect={() => {
                onOpenChange(false);
                navigate({ to: "/app/modules/$slug", params: { slug: m.slug } });
              }}
            >
              <span className="font-mono text-[0.65rem] text-muted-foreground">{m.id}</span>
              {m.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Projects (demo)">
          {DEMO_PROJECTS.map((p) => (
            <CommandItem
              key={p.id}
              value={p.name}
              onSelect={() => {
                onOpenChange(false);
                navigate({ to: "/app/projects" });
              }}
            >
              {p.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Workspace">
          {PAGES.map((p) => (
            <CommandItem
              key={p.to}
              value={p.label}
              onSelect={() => {
                onOpenChange(false);
                navigate({ to: p.to });
              }}
            >
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  return useState(false);
}
