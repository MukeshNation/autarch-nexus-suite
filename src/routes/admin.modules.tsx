import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { syncModuleSettings, updateModuleSettings, listProviders } from "@/lib/admin.functions";
import { MODULE_MANIFEST, STATUS_LABEL, type ModuleStatusSetting } from "@/lib/capabilities";
import { MODULES } from "@/lib/modules";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/modules")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Module control · Autarch AI admin" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Control the public status and readiness of every Autarch AI capability." },
    ],
  }),
  component: ModuleControlPage,
});

const STATUSES: ModuleStatusSetting[] = ["live", "beta", "coming_soon", "maintenance", "disabled"];

type Row = {
  slug: string;
  status: string;
  visible: boolean;
  min_plan: string;
  credits_per_run: number;
};

function ModuleControlPage() {
  const qc = useQueryClient();
  const sync = useServerFn(syncModuleSettings);
  const update = useServerFn(updateModuleSettings);
  const loadProviders = useServerFn(listProviders);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    void sync({ data: {} }).then(() => qc.invalidateQueries({ queryKey: ["module-settings"] }));
  }, [qc, sync]);

  const { data: rows } = useQuery({
    queryKey: ["module-settings"],
    queryFn: async (): Promise<Row[]> => {
      const { data } = await supabase.from("module_settings").select("slug, status, visible, min_plan, credits_per_run");
      return (data ?? []) as Row[];
    },
  });

  const { data: providerData } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: () => loadProviders({ data: {} }),
  });

  const settings = useMemo(() => new Map((rows ?? []).map((r) => [r.slug, r])), [rows]);

  const readiness = (slug: string) => {
    const manifest = MODULE_MANIFEST.find((m) => m.slug === slug);
    if (!manifest || !providerData) return "CHECKING";
    const missing = manifest.required.filter((c) => !providerData.routes[c]?.primary);
    if (missing.length) return `MISSING PROVIDER: ${missing.join(", ")}`;
    return "READY";
  };

  const apply = useMutation({
    mutationFn: (patch: Record<string, unknown>) => update({ data: { slugs: selected, ...patch } as never }),
    onSuccess: () => {
      toast.success("Module settings updated");
      void qc.invalidateQueries({ queryKey: ["module-settings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const toggle = (slug: string) =>
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  return (
    <AdminShell
      title="Module control centre"
      lead="Provider availability and public module status are separate. Connecting a provider never switches a capability on by itself — you decide when each of the 23 modules goes live."
    >
      <section className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-4">
        <span className="label-mono">{selected.length} selected</span>
        {STATUSES.map((s) => (
          <Button
            key={s}
            size="sm"
            variant="outline"
            className="font-mono text-[0.7rem]"
            disabled={selected.length === 0 || apply.isPending}
            onClick={() => apply.mutate({ status: s })}
          >
            Set {STATUS_LABEL[s]}
          </Button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          className="font-mono text-[0.7rem]"
          disabled={selected.length === 0}
          onClick={() => apply.mutate({ visible: true })}
        >
          Visible
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="font-mono text-[0.7rem]"
          disabled={selected.length === 0}
          onClick={() => apply.mutate({ visible: false })}
        >
          Hidden
        </Button>
      </section>

      <section className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-xs">
          <thead className="font-mono text-[0.7rem] uppercase text-muted-foreground">
            <tr className="border-b border-border">
              <th className="p-3"></th>
              <th className="p-3">Module</th>
              <th className="p-3">Required capabilities</th>
              <th className="p-3">Status</th>
              <th className="p-3">Visible</th>
              <th className="p-3">Credits</th>
              <th className="p-3">Readiness</th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map((m) => {
              const row = settings.get(m.slug);
              const manifest = MODULE_MANIFEST.find((x) => x.slug === m.slug);
              return (
                <tr key={m.slug} className="border-b border-border/60">
                  <td className="p-3">
                    <Checkbox checked={selected.includes(m.slug)} onCheckedChange={() => toggle(m.slug)} />
                  </td>
                  <td className="p-3 font-medium">{m.name}</td>
                  <td className="p-3 font-mono text-[0.7rem] text-muted-foreground">
                    {manifest?.required.join(", ")}
                  </td>
                  <td className="p-3">
                    <Select
                      value={row?.status ?? manifest?.defaultStatus ?? "coming_soon"}
                      onValueChange={(v) => {
                        void update({ data: { slugs: [m.slug], status: v as never } }).then(() => {
                          toast.success(`${m.name}: ${STATUS_LABEL[v as ModuleStatusSetting]}`);
                          void qc.invalidateQueries({ queryKey: ["module-settings"] });
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 w-40 font-mono text-[0.7rem]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 font-mono text-[0.7rem]">{row?.visible === false ? "HIDDEN" : "VISIBLE"}</td>
                  <td className="p-3 font-mono text-[0.7rem]">{row?.credits_per_run ?? manifest?.creditsPerRun}</td>
                  <td className="p-3 font-mono text-[0.7rem] text-muted-foreground">{readiness(m.slug)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
