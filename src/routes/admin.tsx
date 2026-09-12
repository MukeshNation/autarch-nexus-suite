import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AutarchWordmark } from "@/components/autarch/logo";
import { ThemeToggle } from "@/components/autarch/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getAdminOverview } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin console · Autarch AI" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Restricted Autarch AI administration console." },
    ],
  }),
  component: AdminPage,
});

const PLANS = ["free", "starter", "pro"] as const;

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  plan: string;
  created_at: string;
  last_seen_at: string;
};

type Subscription = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  granted_free: boolean;
  expires_at: string | null;
};

type Offer = {
  id: string;
  title: string;
  description: string | null;
  code: string | null;
  discount_percent: number;
  target_plan: string;
  grants_free_access: boolean;
  active: boolean;
  ends_at: string | null;
};

type ActivityEvent = {
  id: string;
  user_id: string;
  kind: string;
  path: string | null;
  created_at: string;
};

const LIVE_WINDOW_MS = 5 * 60 * 1000;

function isLive(lastSeen: string) {
  return Date.now() - new Date(lastSeen).getTime() < LIVE_WINDOW_MS;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function AdminPage() {
  const { isAdmin, loading, user } = useAuth();

  if (loading) {
    return <Shell><p className="text-xs text-muted-foreground">Checking access…</p></Shell>;
  }

  if (!user) {
    return (
      <Shell>
        <h1 className="text-lg font-semibold">Sign in required</h1>
        <p className="mt-2 text-xs text-muted-foreground">This console is restricted to workspace administrators.</p>
        <Button asChild size="sm" className="mt-4">
          <Link to="/login">Go to login</Link>
        </Button>
      </Shell>
    );
  }

  if (!isAdmin) {
    return (
      <Shell>
        <h1 className="text-lg font-semibold">Not authorised</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Your account does not have the administrator role. Access is granted server-side through the role table.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to="/app">Back to workspace</Link>
        </Button>
      </Shell>
    );
  }

  return <AdminConsole />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <header className="flex items-center gap-3 border-b border-border px-5 py-3">
        <AutarchWordmark />
        <span className="label-mono">Admin</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline" className="h-8 text-[0.68rem]">
            <Link to="/admin/providers">AI providers</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 text-[0.68rem]">
            <Link to="/admin/modules">Modules</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 text-[0.68rem]">
            <Link to="/admin/payments">Payments</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 text-[0.68rem]">
            <Link to="/admin/support">Support</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 text-[0.68rem]">
            <Link to="/admin/team">Team</Link>
          </Button>
          <ThemeToggle className="size-8" />
          <Link to="/app" className="label-mono hover:text-foreground">
            Workspace
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-4 px-5 py-8">{children}</main>
    </div>
  );
}

function AdminConsole() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    const [p, s, o, e] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("*"),
      supabase.from("offers").select("*").order("created_at", { ascending: false }),
      supabase.from("activity_events").select("*").order("created_at", { ascending: false }).limit(60),
    ]);
    if (p.error || s.error || o.error || e.error) {
      toast.error("Could not load admin data");
      return;
    }
    setProfiles((p.data ?? []) as Profile[]);
    setSubs((s.data ?? []) as Subscription[]);
    setOffers((o.data ?? []) as Offer[]);
    setEvents((e.data ?? []) as ActivityEvent[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Live refresh: realtime stream plus a periodic presence recompute.
  useEffect(() => {
    const channel = supabase
      .channel("admin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_events" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => void load())
      .subscribe();
    const interval = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(interval);
    };
  }, [load]);

  const subByUser = useMemo(() => new Map(subs.map((s) => [s.user_id, s])), [subs]);
  const nameById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p.full_name || p.email || p.id.slice(0, 8)])),
    [profiles],
  );

  const stats = useMemo(() => {
    void tick;
    const today = new Date().toISOString().slice(0, 10);
    const byPlan: Record<string, number> = {};
    for (const p of profiles) byPlan[p.plan] = (byPlan[p.plan] ?? 0) + 1;
    return {
      total: profiles.length,
      live: profiles.filter((p) => isLive(p.last_seen_at)).length,
      newToday: profiles.filter((p) => p.created_at.slice(0, 10) === today).length,
      paying: subs.filter((s) => s.status === "active" && s.plan !== "free").length,
      inactive: subs.filter((s) => s.status !== "active").length,
      free: subs.filter((s) => s.granted_free).length,
      byPlan,
    };
  }, [profiles, subs, tick]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) =>
      [p.full_name, p.email, p.phone, p.plan].some((v) => (v ?? "").toLowerCase().includes(q)),
    );
  }, [profiles, query]);

  async function setPlan(userId: string, plan: string, opts?: { grantFree?: boolean }) {
    setBusy(true);
    const grantFree = opts?.grantFree ?? false;
    const prof = await supabase.from("profiles").update({ plan }).eq("id", userId);
    const existing = subByUser.get(userId);
    const sub = existing
      ? await supabase
          .from("subscriptions")
          .update({ plan, status: "active", granted_free: grantFree })
          .eq("id", existing.id)
      : await supabase.from("subscriptions").insert({ user_id: userId, plan, status: "active", granted_free: grantFree });
    setBusy(false);
    if (prof.error || sub.error) {
      toast.error("Update failed");
      return;
    }
    toast.success(grantFree ? "Free access granted" : `Plan set to ${plan}`);
    void load();
  }

  async function setStatus(userId: string, status: string) {
    const existing = subByUser.get(userId);
    if (!existing) return;
    const { error } = await supabase.from("subscriptions").update({ status }).eq("id", existing.id);
    if (error) toast.error("Update failed");
    else {
      toast.success(`Subscription ${status}`);
      void load();
    }
  }

  return (
    <Shell>
      <section className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Total users" value={stats.total} />
        <Stat label="Live now" value={stats.live} live />
        <Stat label="New today" value={stats.newToday} />
        <Stat label="Paying plans" value={stats.paying} />
        <Stat label="Not active" value={stats.inactive} />
        <Stat label="Free granted" value={stats.free} />
      </section>

      <Tabs defaultValue="platform">
        <TabsList className="text-[0.7rem]">
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="live">Live activity</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="mt-3">
          <PlatformPanel />
        </TabsContent>


        <TabsContent value="users" className="mt-3 space-y-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone or plan"
            className="max-w-sm"
          />
          <div className="panel overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="label-mono border-b border-border">
                <tr>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Last seen</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const sub = subByUser.get(p.id);
                  return (
                    <tr key={p.id} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2">
                          {isLive(p.last_seen_at) && <span className="size-1.5 rounded-full bg-primary" />}
                          {p.full_name ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[0.68rem]">{p.email ?? "—"}</td>
                      <td className="px-3 py-2 text-[0.68rem]">{p.phone ?? "—"}</td>
                      <td className="px-3 py-2">
                        <Select value={p.plan} onValueChange={(v) => void setPlan(p.id, v)} disabled={busy}>
                          <SelectTrigger className="h-7 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PLANS.map((pl) => (
                              <SelectItem key={pl} value={pl} className="text-xs">
                                {pl}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2 text-[0.68rem]">
                        {sub ? `${sub.status}${sub.granted_free ? " · free" : ""}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{timeAgo(p.last_seen_at)}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[0.68rem]"
                            onClick={() => void setPlan(p.id, "pro", { grantFree: true })}
                          >
                            Grant free
                          </Button>
                          {sub?.status === "active" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[0.68rem]"
                              onClick={() => void setStatus(p.id, "cancelled")}
                            >
                              Cancel
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[0.68rem]"
                              onClick={() => void setStatus(p.id, "active")}
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="live" className="mt-3 space-y-3">
          <section className="panel p-4">
            <span className="label-mono">Live users (last 5 minutes)</span>
            <ul className="mt-3 space-y-1.5 text-xs">
              {profiles.filter((p) => isLive(p.last_seen_at)).map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-2 rounded border border-border px-2.5 py-1.5">
                  <span className="pulse-dot size-1.5 rounded-full bg-primary" />
                  <span>{p.full_name ?? "Unnamed"}</span>
                  <span className="text-[0.68rem] text-muted-foreground">{p.email}</span>
                  <span className="text-[0.68rem] text-muted-foreground">{p.phone ?? "no phone"}</span>
                  <span className="ml-auto text-[0.68rem]">{timeAgo(p.last_seen_at)}</span>
                </li>
              ))}
              {stats.live === 0 && <li className="text-muted-foreground">Nobody online right now.</li>}
            </ul>
          </section>
          <section className="panel p-4">
            <span className="label-mono">Activity stream</span>
            <ul className="mt-3 space-y-1 text-[0.68rem] text-muted-foreground">
              {events.map((e) => (
                <li key={e.id} className="flex gap-2">
                  <span className="w-20 shrink-0">{timeAgo(e.created_at)}</span>
                  <span className="flex-1 truncate text-foreground">{nameById.get(e.user_id) ?? e.user_id.slice(0, 8)}</span>
                  <span className="truncate">{e.kind}</span>
                  <span className="truncate">{e.path ?? ""}</span>
                </li>
              ))}
              {events.length === 0 && <li>No activity recorded yet.</li>}
            </ul>
          </section>
        </TabsContent>

        <TabsContent value="offers" className="mt-3">
          <OffersPanel offers={offers} reload={load} />
        </TabsContent>

        <TabsContent value="plans" className="mt-3">
          <section className="panel p-4">
            <span className="label-mono">Plan distribution</span>
            <ul className="mt-3 space-y-1.5 text-xs">
              {PLANS.map((pl) => (
                <li key={pl} className="flex items-center gap-3">
                  <span className="w-16 text-[0.68rem] uppercase">{pl}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded bg-secondary">
                    <span
                      className="block h-full bg-primary"
                      style={{ width: `${stats.total ? ((stats.byPlan[pl] ?? 0) / stats.total) * 100 : 0}%` }}
                    />
                  </span>
                  <span className="w-8 text-right text-[0.68rem]">{stats.byPlan[pl] ?? 0}</span>
                </li>
              ))}
            </ul>
          </section>
        </TabsContent>
      </Tabs>
    </Shell>
  );
}


const PLAN_PRICE: Record<string, number> = { free: 0, starter: 19, pro: 49 };

function PlatformPanel() {
  const overviewFn = useServerFn(getAdminOverview);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => overviewFn({} as never),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return <p className="panel p-4 text-[0.7rem] text-muted-foreground">Loading live platform data…</p>;
  }
  if (error || !data) {
    return <p className="panel p-4 text-[0.7rem] text-muted-foreground">Could not load platform data.</p>;
  }

  const paidSubs = Object.entries(data.subscriptions.byPlan).filter(([plan]) => plan !== "free");
  const mrr = paidSubs.reduce((sum, [plan, count]) => sum + (PLAN_PRICE[plan] ?? 0) * count, 0);
  const paymentsLive = data.payments.status === "live";

  return (
    <div className="space-y-3">
      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active now" value={data.users.activeNow} live />
        <Stat label="Active subscriptions" value={data.subscriptions.active} />
        <Stat label="AI runs (total)" value={data.ai.total} />
        <Stat label="Failed runs" value={data.ai.failed} />
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="panel p-4">
          <span className="label-mono">Revenue</span>
          <p className="mt-1 text-2xl font-semibold tracking-tight">${mrr.toLocaleString()}/mo</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {paymentsLive
              ? "Recurring value of active paid plans at configured prices."
              : "Contracted value of active paid plans at configured prices. No money has been collected — the payment provider is not live yet."}
          </p>
          <ul className="mt-3 space-y-1 text-[0.68rem] text-muted-foreground">
            {paidSubs.length === 0 && <li>No paid subscriptions yet.</li>}
            {paidSubs.map(([plan, count]) => (
              <li key={plan} className="flex justify-between">
                <span>
                  {plan} × {count}
                </span>
                <span>${((PLAN_PRICE[plan] ?? 0) * count).toLocaleString()}</span>
              </li>
            ))}
            <li className="flex justify-between border-t border-border pt-1">
              <span>payments · {data.payments.provider}</span>
              <span>
                {data.payments.status.replace(/_/g, " ")} · {data.payments.environment}
              </span>
            </li>
          </ul>
        </section>

        <section className="panel p-4">
          <span className="label-mono">AI providers</span>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {data.providers.connected}/{data.providers.total || 0}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            connected and tested · {data.providers.enabled} enabled for routing
          </p>
          <ul className="mt-3 space-y-1 text-[0.68rem] text-muted-foreground">
            <li className="flex justify-between">
              <span>average run latency</span>
              <span>{data.ai.avgLatencyMs ? `${(data.ai.avgLatencyMs / 1000).toFixed(1)}s` : "—"}</span>
            </li>
            <li className="flex justify-between">
              <span>running now</span>
              <span>{data.ai.running}</span>
            </li>
            <li className="flex justify-between">
              <span>emergency stop</span>
              <span>{data.flags["ai_emergency_stop"] ? "ON" : "off"}</span>
            </li>
          </ul>
          <Button asChild size="sm" variant="outline" className="mt-3 h-8 text-[0.68rem]">
            <Link to="/admin/providers">Manage providers</Link>
          </Button>
        </section>

        <section className="panel p-4">
          <span className="label-mono">Modules</span>
          <ul className="mt-3 space-y-1 text-[0.68rem] text-muted-foreground">
            {Object.entries(data.modules).length === 0 && <li>No module states saved yet.</li>}
            {Object.entries(data.modules).map(([status, count]) => (
              <li key={status} className="flex justify-between">
                <span>{status.replace(/_/g, " ")}</span>
                <span>{count}</span>
              </li>
            ))}
          </ul>
          <Button asChild size="sm" variant="outline" className="mt-3 h-8 text-[0.68rem]">
            <Link to="/admin/modules">Control modules</Link>
          </Button>
        </section>

        <section className="panel p-4">
          <span className="label-mono">Credits & storage</span>
          <ul className="mt-3 space-y-1 text-[0.68rem] text-muted-foreground">
            <li className="flex justify-between">
              <span>granted</span>
              <span>{data.credits.allocated.toLocaleString()}</span>
            </li>
            <li className="flex justify-between">
              <span>consumed</span>
              <span>{data.credits.consumed.toLocaleString()}</span>
            </li>
            <li className="flex justify-between">
              <span>refunded</span>
              <span>{data.credits.refunded.toLocaleString()}</span>
            </li>
            <li className="flex justify-between">
              <span>files stored</span>
              <span>{(data.storageBytes / 1024 / 1024).toFixed(1)} MB</span>
            </li>
            <li className="flex justify-between">
              <span>new users this month</span>
              <span>{data.users.newThisMonth}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}


function Stat({ label, value, live = false }: { label: string; value: number; live?: boolean }) {
  return (
    <div className="panel p-3">
      <span className="label-mono flex items-center gap-1.5">
        {live && <span className="pulse-dot size-1.5 rounded-full bg-primary" />}
        {label}
      </span>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function OffersPanel({ offers, reload }: { offers: Offer[]; reload: () => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("20");
  const [targetPlan, setTargetPlan] = useState<string>("pro");
  const [grantsFree, setGrantsFree] = useState(false);
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!title.trim()) {
      toast.error("Offer title is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("offers").insert({
      title: title.trim(),
      description: description.trim() || null,
      code: code.trim() || null,
      discount_percent: Number(discount) || 0,
      target_plan: targetPlan,
      grants_free_access: grantsFree,
      active: true,
    });
    setSaving(false);
    if (error) {
      toast.error("Could not create offer");
      return;
    }
    setTitle("");
    setDescription("");
    setCode("");
    toast.success("Offer created");
    await reload();
  }

  async function toggle(offer: Offer) {
    const { error } = await supabase.from("offers").update({ active: !offer.active }).eq("id", offer.id);
    if (error) toast.error("Could not update offer");
    else await reload();
  }

  async function remove(offer: Offer) {
    const { error } = await supabase.from("offers").delete().eq("id", offer.id);
    if (error) toast.error("Could not delete offer");
    else {
      toast.success("Offer deleted");
      await reload();
    }
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="panel p-4">
        <span className="label-mono">Offers</span>
        <ul className="mt-3 space-y-2 text-xs">
          {offers.map((o) => (
            <li key={o.id} className="rounded border border-border p-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{o.title}</span>
                <span className="label-mono">{o.target_plan}</span>
                <span className="text-[0.68rem] text-muted-foreground">
                  {o.grants_free_access ? "free access" : `${o.discount_percent}% off`}
                  {o.code ? ` · ${o.code}` : ""}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <Switch checked={o.active} onCheckedChange={() => void toggle(o)} aria-label="Toggle offer" />
                  <Button size="sm" variant="ghost" className="h-7 text-[0.68rem]" onClick={() => void remove(o)}>
                    Delete
                  </Button>
                </div>
              </div>
              {o.description && <p className="mt-1 text-muted-foreground">{o.description}</p>}
            </li>
          ))}
          {offers.length === 0 && <li className="text-muted-foreground">No offers created yet.</li>}
        </ul>
      </section>

      <section className="panel space-y-2.5 p-4">
        <span className="label-mono">New offer</span>
        <div className="space-y-1">
          <Label htmlFor="offer-title" className="text-xs">Title</Label>
          <Input id="offer-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="offer-desc" className="text-xs">Description</Label>
          <Textarea id="offer-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="offer-code" className="text-xs">Code</Label>
            <Input id="offer-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="offer-discount" className="text-xs">Discount %</Label>
            <Input
              id="offer-discount"
              type="number"
              min={0}
              max={100}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Target plan</Label>
          <Select value={targetPlan} onValueChange={setTargetPlan}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLANS.map((pl) => (
                <SelectItem key={pl} value={pl} className="text-xs">
                  {pl}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <Switch checked={grantsFree} onCheckedChange={setGrantsFree} />
          Grants full free access
        </label>
        <Button size="sm" className="w-full" onClick={() => void create()} disabled={saving}>
          {saving ? "Creating…" : "Create offer"}
        </Button>
      </section>
    </div>
  );
}
