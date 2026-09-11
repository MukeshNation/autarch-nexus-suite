import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AutarchWordmark } from "@/components/autarch/logo";
import { ThemeToggle } from "@/components/autarch/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSupportThread, listSupportTickets, staffReply, updateSupportTicket } from "@/lib/support.functions";
import {
  ISSUE_LABEL,
  ISSUE_TYPES,
  PRIORITIES,
  PRIORITY_LABEL,
  STATUS_LABEL,
  TICKET_STATUSES,
  canManageAll,
  canReply,
  formatDate,
  priorityTone,
  statusTone,
} from "@/lib/support";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin_/support")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Support inbox · Autarch AI admin" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Every Autarch AI support ticket with conversation history, internal notes and assignment." },
    ],
  }),
  component: SupportInboxPage,
});

function SupportInboxPage() {
  const qc = useQueryClient();
  const list = useServerFn(listSupportTickets);
  const loadThread = useServerFn(getSupportThread);
  const reply = useServerFn(staffReply);
  const update = useServerFn(updateSupportTicket);

  const [filters, setFilters] = useState({ search: "", status: "all", priority: "all", issue_type: "all", assigned: "all" });
  const [openId, setOpenId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);

  const inbox = useQuery({
    queryKey: ["admin-support", filters],
    queryFn: () => list({ data: filters }),
    retry: false,
    refetchInterval: 30_000,
  });

  const thread = useQuery({
    queryKey: ["admin-support-thread", openId],
    queryFn: () => loadThread({ data: { ticketId: openId! } }),
    enabled: Boolean(openId),
  });

  const replyMutation = useMutation({
    mutationFn: () => reply({ data: { ticketId: openId!, body: body.trim(), internal } }),
    onSuccess: () => {
      setBody("");
      void qc.invalidateQueries({ queryKey: ["admin-support-thread", openId] });
      void qc.invalidateQueries({ queryKey: ["admin-support"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save that reply."),
  });

  const updateMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => update({ data: { ticketId: openId!, ...input } as never }),
    onSuccess: () => {
      toast.success("Ticket updated");
      void qc.invalidateQueries({ queryKey: ["admin-support"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update the ticket."),
  });

  const role = inbox.data?.role ?? null;
  const metrics = inbox.data?.metrics;
  const team = inbox.data?.team ?? [];
  const ticket = (inbox.data?.tickets ?? []).find((t) => t.id === openId) ?? null;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-3">
          <AutarchWordmark />
          <span className="text-[0.7rem] text-muted-foreground">Support inbox</span>
          <nav className="ml-auto flex items-center gap-1">
            <Link to="/admin" className="rounded-md px-2.5 py-1.5 text-[0.7rem] text-muted-foreground hover:bg-secondary">
              Console
            </Link>
            <Link to="/admin/team" className="rounded-md px-2.5 py-1.5 text-[0.7rem] text-muted-foreground hover:bg-secondary">
              Team
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Support inbox</h1>

        {inbox.isLoading ? (
          <p className="mt-8 text-xs text-muted-foreground">Checking access…</p>
        ) : inbox.isError ? (
          <p className="mt-8 rounded-lg border border-border bg-secondary/40 p-6 text-sm">
            This inbox is limited to the owner and active support team members.
          </p>
        ) : (
          <>
            {metrics && (
              <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { label: "Open", value: metrics.open },
                  { label: "Urgent", value: metrics.urgent },
                  { label: "Pending", value: metrics.pending },
                  { label: "Resolved today", value: metrics.resolvedToday },
                  {
                    label: "Avg first response",
                    value: metrics.avgResponseMinutes === null ? "—" : `${metrics.avgResponseMinutes} min`,
                  },
                ].map((m) => (
                  <div key={m.label} className="panel p-4">
                    <div className="text-[0.65rem] text-muted-foreground">{m.label}</div>
                    <div className="mt-1 text-xl">{m.value}</div>
                  </div>
                ))}
              </div>
            )}

            {metrics && metrics.workload.length > 0 && (
              <div className="panel mt-3 p-4">
                <div className="text-[0.65rem] text-muted-foreground">Agent workload (active tickets)</div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {metrics.workload.map((w) => (
                    <span key={w.email} className="rounded-full bg-secondary px-3 py-1">
                      {w.name} · {w.role} · {w.open}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <Input
                placeholder="Search ID, name, email, subject"
                className="text-xs"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
              {[
                { key: "status", options: [{ value: "all", label: "All statuses" }, ...TICKET_STATUSES] },
                { key: "priority", options: [{ value: "all", label: "All priorities" }, ...PRIORITIES] },
                { key: "issue_type", options: [{ value: "all", label: "All types" }, ...ISSUE_TYPES] },
              ].map((f) => (
                <Select
                  key={f.key}
                  value={(filters as Record<string, string>)[f.key] ?? "all"}
                  onValueChange={(v) => setFilters((prev) => ({ ...prev, [f.key]: v }))}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
              <Select value={filters.assigned} onValueChange={(v) => setFilters((f) => ({ ...f, assigned: v }))}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    Anyone
                  </SelectItem>
                  <SelectItem value="unassigned" className="text-xs">
                    Unassigned
                  </SelectItem>
                  {team
                    .filter((m) => m.user_id)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.user_id!} className="text-xs">
                        {m.full_name || m.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
              <div className="space-y-2">
                {(inbox.data?.tickets ?? []).length === 0 ? (
                  <div className="panel p-6 text-xs text-muted-foreground">No tickets match these filters.</div>
                ) : (
                  (inbox.data?.tickets ?? []).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setOpenId(t.id)}
                      className={cn(
                        "panel w-full p-4 text-left transition-colors hover:bg-secondary/50",
                        openId === t.id && "bg-secondary/60",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[0.65rem] text-muted-foreground">{t.ticket_code}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[0.62rem]", statusTone(t.status))}>
                          {STATUS_LABEL[t.status] ?? t.status}
                        </span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[0.62rem]", priorityTone(t.priority))}>
                          {PRIORITY_LABEL[t.priority] ?? t.priority}
                        </span>
                        <span className="ml-auto text-[0.62rem] text-muted-foreground">{formatDate(t.created_at)}</span>
                      </div>
                      <div className="mt-1.5 text-sm">{t.subject}</div>
                      <div className="mt-1 text-[0.65rem] text-muted-foreground">
                        {t.full_name} · {t.email}
                        {t.phone ? ` · ${t.phone}` : ""} · {ISSUE_LABEL[t.issue_type] ?? t.issue_type} ·{" "}
                        {t.assigned_name ?? "unassigned"}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="panel p-5">
                {!ticket ? (
                  <p className="text-xs text-muted-foreground">Select a ticket to read the full conversation.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[0.65rem] text-muted-foreground">{ticket.ticket_code}</span>
                      <span className="text-sm">{ticket.subject}</span>
                    </div>
                    <div className="mt-1 text-[0.65rem] text-muted-foreground">
                      {ticket.full_name} · {ticket.email}
                      {ticket.phone ? ` · ${ticket.phone}` : ""}
                    </div>

                    {canReply(role) && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <Select value={ticket.status} onValueChange={(v) => updateMutation.mutate({ status: v })}>
                          <SelectTrigger className="text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TICKET_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value} className="text-xs">
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={ticket.priority} onValueChange={(v) => updateMutation.mutate({ priority: v })}>
                          <SelectTrigger className="text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITIES.map((p) => (
                              <SelectItem key={p.value} value={p.value} className="text-xs">
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {canManageAll(role) && (
                          <Select
                            value={ticket.assigned_to ?? "unassigned"}
                            onValueChange={(v) => updateMutation.mutate({ assigned_to: v === "unassigned" ? null : v })}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Assign" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned" className="text-xs">
                                Unassigned
                              </SelectItem>
                              {team
                                .filter((m) => m.user_id && m.status === "active")
                                .map((m) => (
                                  <SelectItem key={m.id} value={m.user_id!} className="text-xs">
                                    {m.full_name || m.email}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    {thread.data?.attachmentUrl && (
                      <a
                        href={thread.data.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-xs underline underline-offset-4"
                      >
                        Open attachment ({ticket.attachment_name})
                      </a>
                    )}

                    <div className="mt-4 max-h-96 space-y-3 overflow-y-auto border-t border-border pt-4">
                      {(thread.data?.messages ?? []).map((m) => (
                        <div
                          key={m.id}
                          className={cn(
                            "rounded-lg p-3 text-xs leading-relaxed",
                            m.internal
                              ? "border border-amber-500/40 bg-amber-500/5"
                              : m.author_role === "user"
                                ? "bg-secondary/60"
                                : "border border-border bg-primary/5",
                          )}
                        >
                          <div className="mb-1 text-[0.62rem] text-muted-foreground">
                            {m.author_name ?? "Autarch"} · {m.internal ? "internal note" : m.author_role} ·{" "}
                            {formatDate(m.created_at)}
                          </div>
                          <p className="whitespace-pre-wrap">{m.body}</p>
                        </div>
                      ))}
                    </div>

                    {canReply(role) ? (
                      <div className="mt-4">
                        <Textarea
                          rows={4}
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          placeholder={internal ? "Internal note — the customer never sees this…" : "Reply to the customer…"}
                          className="text-xs"
                        />
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            size="sm"
                            className="rounded-full text-xs"
                            disabled={body.trim().length < 2 || replyMutation.isPending}
                            onClick={() => replyMutation.mutate()}
                          >
                            {replyMutation.isPending ? "Saving…" : internal ? "Save note" : "Send reply"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full text-xs"
                            onClick={() => setInternal((v) => !v)}
                          >
                            {internal ? "Switch to reply" : "Switch to internal note"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-[0.65rem] text-muted-foreground">
                        Read-only analysts can review tickets but cannot reply or change them.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
