import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  inviteSupportMember,
  listSupportTeam,
  removeSupportMember,
  updateSupportMember,
} from "@/lib/support.functions";
import { TEAM_ROLES, TEAM_ROLE_LABEL, TEAM_STATUSES, formatDate } from "@/lib/support";

export const Route = createFileRoute("/admin_/team")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Support team · Autarch AI admin" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Owner-only management of Autarch AI support agents, managers and read-only analysts." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const qc = useQueryClient();
  const load = useServerFn(listSupportTeam);
  const invite = useServerFn(inviteSupportMember);
  const update = useServerFn(updateSupportMember);
  const remove = useServerFn(removeSupportMember);
  const [role, setRole] = useState("agent");

  const team = useQuery({ queryKey: ["support-team"], queryFn: () => load({} as never), retry: false });
  const refresh = () => qc.invalidateQueries({ queryKey: ["support-team"] });

  const inviteMutation = useMutation({
    mutationFn: (input: { email: string; full_name: string; team_role: string }) => invite({ data: input as never }),
    onSuccess: (res) => {
      toast.success(res.linked ? "Team member added and activated" : "Invitation recorded");
      void refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add that member."),
  });

  const updateMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => update({ data: input as never }),
    onSuccess: () => void refresh(),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update that member."),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Access removed");
      void refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove that member."),
  });

  return (
    <AdminShell
      title="Support team"
      lead="Only you can add or remove team members. Nobody on the support team can reach API keys, payment credentials, provider settings or owner controls."
    >
      <section className="panel p-5">
        <h2 className="text-sm">Add a team member</h2>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            inviteMutation.mutate({
              email: String(form.get("email") ?? ""),
              full_name: String(form.get("full_name") ?? ""),
              team_role: role,
            });
            e.currentTarget.reset();
          }}
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="mt-1.5 text-xs" />
          </div>
          <div>
            <Label htmlFor="full_name">Name (optional)</Label>
            <Input id="full_name" name="full_name" className="mt-1.5 text-xs" />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="mt-1.5 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAM_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-xs">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" size="sm" disabled={inviteMutation.isPending} className="w-full rounded-full text-xs">
              {inviteMutation.isPending ? "Adding…" : "Add member"}
            </Button>
          </div>
        </form>
        <ul className="mt-4 space-y-1 text-[0.65rem] text-muted-foreground">
          {TEAM_ROLES.map((r) => (
            <li key={r.value}>
              <span className="text-foreground">{r.label}:</span> {r.blurb}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-5">
        <h2 className="text-sm">Team roster</h2>
        {team.isLoading ? (
          <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
        ) : team.isError ? (
          <p className="mt-3 text-xs text-muted-foreground">Only the owner can manage the support team.</p>
        ) : (team.data?.members ?? []).length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No team members yet — you are handling support alone.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {(team.data?.members ?? []).map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <div className="text-xs">{m.full_name || m.email}</div>
                  <div className="text-[0.62rem] text-muted-foreground">
                    {m.email} · {TEAM_ROLE_LABEL[m.team_role] ?? m.team_role} · added {formatDate(m.created_at)}
                    {m.user_id ? "" : " · account not linked yet"}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Select value={m.team_role} onValueChange={(v) => updateMutation.mutate({ id: m.id, team_role: v })}>
                    <SelectTrigger className="w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value} className="text-xs">
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={m.status} onValueChange={(v) => updateMutation.mutate({ id: m.id, status: v })}>
                    <SelectTrigger className="w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full text-xs"
                    onClick={() => removeMutation.mutate(m.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel p-5">
        <h2 className="text-sm">Audit trail</h2>
        {(team.data?.auditTrail ?? []).length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No support actions recorded yet.</p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-[0.65rem] text-muted-foreground">
            {(team.data?.auditTrail ?? []).map((log) => (
              <li key={log.id}>
                {formatDate(log.created_at)} · <span className="text-foreground">{log.action}</span> ·{" "}
                {JSON.stringify(log.metadata ?? {})}
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
