import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { listProviders, saveProvider, deleteProvider, testProvider, setCapabilityRoute } from "@/lib/admin.functions";
import { ADAPTERS, CAPABILITIES, IMPLEMENTED_ADAPTERS, MODULE_MANIFEST } from "@/lib/capabilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin_/providers")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "AI providers · Autarch AI admin" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Configure AI providers and capability routing for Autarch AI." },
    ],
  }),
  component: ProvidersPage,
});

const NONE = "__none__";

function ProvidersPage() {
  const qc = useQueryClient();
  const load = useServerFn(listProviders);
  const save = useServerFn(saveProvider);
  const remove = useServerFn(deleteProvider);
  const test = useServerFn(testProvider);
  const route = useServerFn(setCapabilityRoute);

  const { data, isLoading, error } = useQuery({ queryKey: ["admin-providers"], queryFn: () => load({ data: {} }) });

  const [form, setForm] = useState({
    name: "",
    category: "llm",
    adapter: "openai_compatible",
    base_url: "",
    model: "",
    capability: "MAIN_LLM",
    api_key: "",
    timeout_ms: 60000,
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin-providers"] });

  const create = useMutation({
    mutationFn: () =>
      save({
        data: {
          name: form.name.trim(),
          category: form.category,
          adapter: form.adapter,
          base_url: form.base_url.trim(),
          model: form.model.trim(),
          capabilities: [form.capability as never],
          enabled: true,
          priority: 100,
          timeout_ms: Number(form.timeout_ms),
          api_key: form.api_key,
        },
      }),
    onSuccess: () => {
      toast.success("Provider saved. Test the connection, then set it active.");
      setForm({ ...form, name: "", base_url: "", model: "", api_key: "" });
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save provider."),
  });

  const providers = data?.providers ?? [];
  const routes = data?.routes ?? {};

  const moduleCount = (capability: string) =>
    MODULE_MANIFEST.filter((m) => m.required.includes(capability as never)).length;

  return (
    <AdminShell
      title="AI provider control"
      lead="Add a provider once, test it, then activate it for a capability. Every module wired to that capability resolves it automatically — no module-by-module assignment. Keys are stored server-side and never shown again."
    >
      <section className="rounded-lg border border-border p-5">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Add provider</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <Label className="label-mono">Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="DeepSeek" />
          </div>
          <div>
            <Label className="label-mono">Adapter</Label>
            <Select value={form.adapter} onValueChange={(v) => setForm({ ...form, adapter: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADAPTERS.map((a) => (
                  <SelectItem key={a.id} value={a.id} disabled={!a.implemented}>
                    {a.label}
                    {a.implemented ? "" : " — new adapter required"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="label-mono">Capability</Label>
            <Select value={form.capability} onValueChange={(v) => setForm({ ...form, capability: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAPABILITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c} · {moduleCount(c)} modules
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="label-mono">Base URL</Label>
            <Input
              value={form.base_url}
              onChange={(e) => setForm({ ...form, base_url: e.target.value })}
              placeholder="https://api.deepseek.com/v1"
            />
          </div>
          <div>
            <Label className="label-mono">Model id</Label>
            <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="deepseek-chat" />
          </div>
          <div>
            <Label className="label-mono">API key</Label>
            <Input
              type="password"
              value={form.api_key}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
              placeholder="stored server-side only"
            />
          </div>
        </div>
        <Button
          className="mt-4 font-mono text-xs"
          disabled={create.isPending || !form.name || !form.base_url || !form.model || form.api_key.length < 8}
          onClick={() => create.mutate()}
        >
          {create.isPending ? "Saving…" : "Save provider"}
        </Button>
        {!IMPLEMENTED_ADAPTERS.includes(form.adapter) && (
          <p className="mt-2 font-mono text-[0.7rem] text-muted-foreground">
            NEW ADAPTER REQUIRED — this protocol has no implementation yet.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-border p-5">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Configured providers</h2>
        {isLoading ? (
          <p className="mt-4 label-mono">Loading…</p>
        ) : error ? (
          <p className="mt-4 label-mono">UNAVAILABLE</p>
        ) : providers.length === 0 ? (
          <p className="mt-4 label-mono">NOT CONFIGURED — no provider added yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="font-mono text-[0.7rem] uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Provider</th>
                  <th className="py-2">Capabilities</th>
                  <th className="py-2">Model</th>
                  <th className="py-2">Key</th>
                  <th className="py-2">Last test</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="py-2 font-mono text-[0.7rem]">{p.capabilities.join(", ")}</td>
                    <td className="py-2 font-mono text-[0.7rem]">{p.model}</td>
                    <td className="py-2 font-mono text-[0.7rem]">{p.secret_masked}</td>
                    <td className="py-2 font-mono text-[0.7rem]">{p.last_test_status ?? "NOT TESTED"}</td>
                    <td className="py-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="font-mono text-[0.7rem]"
                          onClick={async () => {
                            const res = await test({ data: { id: p.id } });
                            toast[res.status === "CONNECTED" ? "success" : "error"](res.status);
                            invalidate();
                          }}
                        >
                          Test
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="font-mono text-[0.7rem]"
                          onClick={async () => {
                            await remove({ data: { id: p.id } });
                            toast.success("Provider removed");
                            invalidate();
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border p-5">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Capability routing</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          The active provider for a capability serves every module that requires it. Switching here changes new requests
          only — history, projects and usage stay intact.
        </p>
        <div className="mt-4 space-y-3">
          {CAPABILITIES.map((c) => {
            const current = routes[c] ?? { primary: null, fallback: null };
            const eligible = providers.filter((p) => p.capabilities.includes(c));
            return (
              <div key={c} className="grid items-center gap-3 rounded-md border border-border p-3 md:grid-cols-4">
                <div>
                  <p className="font-mono text-[0.7rem]">{c}</p>
                  <p className="text-[0.7rem] text-muted-foreground">{moduleCount(c)} modules wired</p>
                </div>
                <div className="md:col-span-1">
                  <Label className="label-mono">Active</Label>
                  <Select
                    value={current.primary ?? NONE}
                    onValueChange={async (v) => {
                      await route({
                        data: {
                          capability: c,
                          primary_provider_id: v === NONE ? null : v,
                          fallback_provider_id: current.fallback,
                        },
                      });
                      toast.success(`${c} routing updated`);
                      invalidate();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None (missing provider)</SelectItem>
                      {eligible.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="label-mono">Fallback</Label>
                  <Select
                    value={current.fallback ?? NONE}
                    onValueChange={async (v) => {
                      await route({
                        data: {
                          capability: c,
                          primary_provider_id: current.primary,
                          fallback_provider_id: v === NONE ? null : v,
                        },
                      });
                      toast.success(`${c} fallback updated`);
                      invalidate();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      {eligible.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="font-mono text-[0.7rem] text-muted-foreground">
                  {eligible.length === 0 ? "MISSING PROVIDER" : current.primary ? "ROUTED" : "NOT ACTIVATED"}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AdminShell>
  );
}

