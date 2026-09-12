import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { WorkspacePage } from "@/components/workspace/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMyTicket, getMyTicketThread, listMyTickets, replyToMyTicket } from "@/lib/support.functions";
import {
  ISSUE_LABEL,
  ISSUE_TYPES,
  PRIORITIES,
  PRIORITY_LABEL,
  STATUS_LABEL,
  formatDate,
  priorityTone,
  statusTone,
} from "@/lib/support";
import { cn } from "@/lib/utils";
import { ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENT_BYTES } from "@/lib/support";

export const Route = createFileRoute("/app/support")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Support · Autarch AI" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Open support tickets, read replies and track resolution inside your Autarch AI workspace." },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const qc = useQueryClient();
  const list = useServerFn(listMyTickets);
  const create = useServerFn(createMyTicket);
  const thread = useServerFn(getMyTicketThread);
  const reply = useServerFn(replyToMyTicket);

  const [openTicket, setOpenTicket] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [issueType, setIssueType] = useState("technical");
  const [priority, setPriority] = useState("normal");
  const [replyBody, setReplyBody] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const tickets = useQuery({ queryKey: ["my-tickets"], queryFn: () => list({} as never) });
  const detail = useQuery({
    queryKey: ["my-ticket", openTicket],
    queryFn: () => {
      if (!openTicket) throw new Error("Select a ticket first.");
      return thread({ data: { ticketId: openTicket } });
    },
    enabled: Boolean(openTicket),
  });

  const createMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => create({ data: input as never }),
    onSuccess: (res) => {
      toast.success(`Ticket ${res.ticket_code} created`);
      setComposing(false);
      void qc.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not open the ticket."),
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => {
      if (!openTicket) throw new Error("Select a ticket first.");
      return reply({ data: { ticketId: openTicket, body } });
    },
    onSuccess: () => {
      setReplyBody("");
      void qc.invalidateQueries({ queryKey: ["my-ticket", openTicket] });
      void qc.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send your reply."),
  });

  return (
    <WorkspacePage
      title="Support"
      lead="Open a request, follow the conversation and see exactly where each ticket stands."
      actions={
        <Button size="sm" className="rounded-full text-xs" onClick={() => setComposing((v) => !v)}>
          {composing ? "Cancel" : "New ticket"}
        </Button>
      }
    >
      {composing && (
        <form
          className="panel mb-6 p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            let attachment: { name: string; type: string; dataBase64: string } | null = null;
            if (file) {
              if (file.size > MAX_ATTACHMENT_BYTES) return toast.error("Attachment is larger than 5 MB.");
              if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) return toast.error("Use a PNG, JPG, WEBP, GIF, PDF or TXT file.");
              const dataBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = () => reject(new Error("Could not read that file."));
                reader.readAsDataURL(file);
              });
              attachment = { name: file.name, type: file.type, dataBase64 };
            }
            createMutation.mutate({
              phone: String(form.get("phone") ?? ""),
              issue_type: issueType,
              priority,
              subject: String(form.get("subject") ?? ""),
              message: String(form.get("message") ?? ""),
              attachment,
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" name="phone" className="mt-1.5 text-xs" />
            </div>
            <div>
              <Label>Issue type</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger className="mt-1.5 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((i) => (
                    <SelectItem key={i.value} value={i.value} className="text-xs">
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1.5 text-xs">
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
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" required minLength={4} className="mt-1.5 text-xs" />
          </div>
          <div className="mt-4">
            <Label htmlFor="support-attachment">Screenshot or file (optional)</Label>
            <Input
              id="support-attachment"
              type="file"
              accept={ALLOWED_ATTACHMENT_TYPES.join(",")}
              className="mt-1.5 text-xs"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1.5 text-[0.65rem] text-muted-foreground">PNG, JPG, WEBP, GIF, PDF or TXT up to 5 MB.</p>
          </div>
          <div className="mt-4">
            <Label htmlFor="message">Details</Label>
            <Textarea id="message" name="message" rows={5} required minLength={20} className="mt-1.5 text-xs" />
          </div>
          <Button type="submit" size="sm" disabled={createMutation.isPending} className="mt-4 rounded-full text-xs">
            {createMutation.isPending ? "Opening…" : "Open ticket"}
          </Button>
        </form>
      )}

      {tickets.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading your tickets…</p>
      ) : (tickets.data ?? []).length === 0 ? (
        <div className="panel p-8 text-center text-xs text-muted-foreground">
          You have no support tickets yet. Open one whenever something needs attention.
        </div>
      ) : (
        <div className="space-y-3">
          {(tickets.data ?? []).map((t) => (
            <div key={t.id} className="panel p-4">
              <button
                type="button"
                className="flex w-full flex-wrap items-center gap-2 text-left"
                onClick={() => setOpenTicket(openTicket === t.id ? null : t.id)}
              >
                <span className="text-xs text-muted-foreground">{t.ticket_code}</span>
                <span className="text-sm">{t.subject}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[0.62rem]", statusTone(t.status))}>
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[0.62rem]", priorityTone(t.priority))}>
                  {PRIORITY_LABEL[t.priority] ?? t.priority}
                </span>
                <span className="ml-auto text-[0.65rem] text-muted-foreground">{formatDate(t.created_at)}</span>
              </button>

              {openTicket === t.id && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="text-[0.65rem] text-muted-foreground">
                    {ISSUE_LABEL[t.issue_type] ?? t.issue_type}
                    {t.attachment_name ? ` · attachment: ${t.attachment_name}` : ""}
                  </div>
                  {detail.data?.attachmentUrl && (
                    <a
                      href={detail.data.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-xs underline underline-offset-4"
                    >
                      Open attachment ({t.attachment_name})
                    </a>
                  )}
                  <div className="mt-3 space-y-3">
                    {detail.isLoading ? (
                      <p className="text-xs text-muted-foreground">Loading conversation…</p>
                    ) : (
                      (detail.data?.messages ?? []).map((m) => (
                        <div
                          key={m.id}
                          className={cn(
                            "rounded-lg p-3 text-xs leading-relaxed",
                            m.author_role === "user" ? "bg-secondary/60" : "bg-primary/5 border border-border",
                          )}
                        >
                          <div className="mb-1 text-[0.62rem] text-muted-foreground">
                            {m.author_role === "user" ? "You" : (m.author_name ?? "Autarch Support")} · {formatDate(m.created_at)}
                          </div>
                          <p className="whitespace-pre-wrap">{m.body}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {t.status !== "closed" ? (
                    <div className="mt-4">
                      <Textarea
                        rows={3}
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Write a reply…"
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        className="mt-2 rounded-full text-xs"
                        disabled={replyBody.trim().length < 2 || replyMutation.isPending}
                        onClick={() => replyMutation.mutate(replyBody.trim())}
                      >
                        {replyMutation.isPending ? "Sending…" : "Send reply"}
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-4 text-[0.65rem] text-muted-foreground">
                      This ticket is closed. Open a new one to continue.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </WorkspacePage>
  );
}
