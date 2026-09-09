import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { savePaymentProvider, setPlatformFlag, getAdminOverview } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin_/payments")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Payments & safety · Autarch AI admin" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Configure the Autarch AI payment provider and platform safety switches." },
    ],
  }),
  component: PaymentsPage,
});

const STATUS_COPY: Record<string, string> = {
  not_configured: "NOT CONFIGURED",
  test_mode: "TEST MODE",
  live: "LIVE",
  disabled: "DISABLED",
  maintenance: "MAINTENANCE",
  error: "ERROR",
};

function PaymentsPage() {
  const qc = useQueryClient();
  const save = useServerFn(savePaymentProvider);
  const flag = useServerFn(setPlatformFlag);
  const overviewFn = useServerFn(getAdminOverview);

  const { data: overview } = useQuery({ queryKey: ["admin-overview"], queryFn: () => overviewFn({} as never) });

  const [form, setForm] = useState({
    environment: "sandbox",
    enabled: false,
    key_id: "",
    api_secret: "",
    webhook_secret: "",
  });

  const submit = useMutation({
    mutationFn: () =>
      save({
        data: {
          environment: form.environment as "sandbox" | "live",
          enabled: form.enabled,
          key_id: form.key_id.trim(),
          ...(form.api_secret ? { api_secret: form.api_secret } : {}),
          ...(form.webhook_secret ? { webhook_secret: form.webhook_secret } : {}),
          ...(form.environment === "live" ? { confirm_live: "CONFIRM" as const } : {}),
        },
      }),
    onSuccess: () => {
      toast.success("Payment configuration saved");
      setForm({ ...form, api_secret: "", webhook_secret: "" });
      void qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save configuration"),
  });

  const setFlag = async (key: "ai_emergency_stop" | "payments_disable_checkout" | "payments_maintenance", enabled: boolean) => {
    await flag({ data: { key, enabled, confirm: "CONFIRM" } });
    toast.success(`${key.replace(/_/g, " ")} ${enabled ? "enabled" : "disabled"}`);
    void qc.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  const flags = overview?.flags ?? {};

  return (
    <AdminShell
      title="Payments & platform safety"
      lead="Razorpay credentials are stored server-side and never returned to the browser. Saving credentials does not switch real payments on — live mode is an explicit, separate decision."
    >
      <section className="rounded-lg border border-border p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Razorpay</h2>
          <span className="rounded-md bg-secondary px-2 py-1 text-[0.7rem]">
            {STATUS_COPY[overview?.payments.status ?? "not_configured"]}
          </span>
          <span className="label-mono">
            webhook {overview?.payments.webhook_configured ? "configured" : "not configured"}
          </span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label className="label-mono">Environment</Label>
            <Select value={form.environment} onValueChange={(v) => setForm({ ...form, environment: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Test</SelectItem>
                <SelectItem value="live">Live</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="label-mono">Key ID</Label>
            <Input value={form.key_id} onChange={(e) => setForm({ ...form, key_id: e.target.value })} />
          </div>
          <div>
            <Label className="label-mono">Key secret</Label>
            <Input
              type="password"
              value={form.api_secret}
              onChange={(e) => setForm({ ...form, api_secret: e.target.value })}
              placeholder="stored server-side only"
            />
          </div>
          <div>
            <Label className="label-mono">Webhook secret</Label>
            <Input
              type="password"
              value={form.webhook_secret}
              onChange={(e) => setForm({ ...form, webhook_secret: e.target.value })}
              placeholder="stored server-side only"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
          <span className="text-xs text-muted-foreground">Enable this provider for checkout creation</span>
        </div>

        <Button
          className="mt-4 text-xs"
          disabled={submit.isPending || form.key_id.trim().length < 4}
          onClick={() => submit.mutate()}
        >
          {submit.isPending ? "Saving…" : "Save configuration"}
        </Button>

        <p className="mt-3 text-xs text-muted-foreground">
          Checkout, server-side verification and webhook processing are not yet wired to a live account, so no payment
          can be taken. Nothing here charges a card.
        </p>
      </section>

      <section className="rounded-lg border border-border p-5">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Emergency controls</h2>
        <div className="mt-4 space-y-4">
          {(
            [
              ["ai_emergency_stop", "Emergency stop all AI requests", "Blocks every new provider call. Data, history and configuration are preserved."],
              ["payments_disable_checkout", "Disable new checkouts", "Stops new purchases without touching AI or existing subscriptions."],
              ["payments_maintenance", "Payments maintenance", "Shows a temporary message instead of the purchase flow."],
            ] as const
          ).map(([key, label, note]) => (
            <div key={key} className="flex items-start gap-3">
              <Switch checked={Boolean(flags[key])} onCheckedChange={(v) => void setFlag(key, v)} />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
