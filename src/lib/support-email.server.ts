/**
 * AUTARCH AI — support email composition and dispatch (server only).
 *
 * Every message is recorded in support_email_outbox first, so nothing is lost.
 * Dispatch happens through the managed email service when a verified sender
 * domain is configured; until then rows stay queued and remain visible to the
 * owner. No credential is ever returned to the browser.
 */
import { SUPPORT_EMAIL, ISSUE_LABEL, PRIORITY_LABEL, STATUS_LABEL } from "./support";

type Ticket = {
  id: string;
  ticket_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  issue_type: string;
  priority: string;
  subject: string;
  message: string;
  status: string;
  attachment_name?: string | null;
  created_at?: string;
};

function shell(title: string, rows: Array<[string, string]>, body: string) {
  const table = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#6b7280;font-size:13px">${k}</td><td style="padding:6px 0;font-size:13px;color:#111827">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  return `<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;padding:28px">
  <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#6b7280">Autarch AI Support</div>
  <h1 style="font-size:20px;margin:10px 0 18px;color:#111827">${escapeHtml(title)}</h1>
  <table style="border-collapse:collapse;margin-bottom:18px">${table}</table>
  <div style="white-space:pre-wrap;border-top:1px solid #e5e7eb;padding-top:16px;font-size:14px;line-height:1.6;color:#111827">${escapeHtml(body)}</div>
  <p style="margin-top:24px;font-size:12px;color:#6b7280">Reply to this email or open your ticket inside the Autarch AI workspace.</p>
</div>`;
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function ownerNotification(ticket: Ticket) {
  return {
    to: SUPPORT_EMAIL,
    kind: "owner_new_ticket",
    subject: `[${ticket.ticket_code}] ${PRIORITY_LABEL[ticket.priority] ?? ticket.priority} · ${ticket.subject}`,
    body: shell(
      "New support ticket",
      [
        ["Ticket", ticket.ticket_code],
        ["Name", ticket.full_name],
        ["Email", ticket.email],
        ["Phone", ticket.phone || "not provided"],
        ["Category", ISSUE_LABEL[ticket.issue_type] ?? ticket.issue_type],
        ["Priority", PRIORITY_LABEL[ticket.priority] ?? ticket.priority],
        ["Status", STATUS_LABEL[ticket.status] ?? ticket.status],
        ["Attachment", ticket.attachment_name || "none"],
        ["Subject", ticket.subject],
      ],
      ticket.message,
    ),
  };
}

export function userConfirmation(ticket: Ticket) {
  return {
    to: ticket.email,
    kind: "user_confirmation",
    subject: `We received your request — ticket ${ticket.ticket_code}`,
    body: shell(
      `Thanks ${ticket.full_name.split(" ")[0] ?? ""}, your ticket is open`,
      [
        ["Ticket ID", ticket.ticket_code],
        ["Category", ISSUE_LABEL[ticket.issue_type] ?? ticket.issue_type],
        ["Priority", PRIORITY_LABEL[ticket.priority] ?? ticket.priority],
        ["Subject", ticket.subject],
      ],
      `Our team has your request and will reply to this address.\n\nWhat you sent:\n\n${ticket.message}`,
    ),
  };
}

export function staffReplyNotice(ticket: Ticket, reply: string) {
  return {
    to: ticket.email,
    kind: "staff_reply",
    subject: `Reply on ticket ${ticket.ticket_code} — ${ticket.subject}`,
    body: shell(
      "New reply from Autarch AI Support",
      [
        ["Ticket ID", ticket.ticket_code],
        ["Status", STATUS_LABEL[ticket.status] ?? ticket.status],
      ],
      reply,
    ),
  };
}

export function teamInvite(email: string, roleLabel: string) {
  return {
    to: email,
    kind: "team_invite",
    subject: "You have been invited to the Autarch AI support team",
    body: shell(
      "Support team invitation",
      [
        ["Email", email],
        ["Role", roleLabel],
      ],
      "Create an Autarch AI account with this email address, then sign in. Your support access is activated automatically once the account exists. Support access never includes provider keys, payment credentials or owner settings.",
    ),
  };
}

type Outgoing = { to: string; kind: string; subject: string; body: string };

/**
 * Queue and attempt delivery. Never throws — a mail failure must not lose a ticket.
 */
export async function queueEmails(
  db: { from: (t: string) => any },
  ticketId: string | null,
  messages: Outgoing[],
) {
  for (const m of messages) {
    const { data } = await db
      .from("support_email_outbox")
      .insert({ ticket_id: ticketId, to_email: m.to, kind: m.kind, subject: m.subject, body: m.body } as never)
      .select("id")
      .maybeSingle();
    const id = data?.id as string | undefined;
    const result = await deliver(m);
    if (!id) continue;
    await db
      .from("support_email_outbox")
      .update(
        result.sent
          ? { status: "sent", sent_at: new Date().toISOString(), error: null }
          : { status: result.pending ? "queued" : "failed", error: result.error ?? null },
      )
      .eq("id", id);
  }
}

async function deliver(m: Outgoing): Promise<{ sent: boolean; pending?: boolean; error?: string }> {
  const endpoint = process.env["LOVABLE_EMAIL_ENDPOINT"];
  const apiKey = process.env["LOVABLE_API_KEY"];
  const from = process.env["SUPPORT_EMAIL_FROM"];
  if (!endpoint || !apiKey || !from) {
    return { sent: false, pending: true, error: "Sender domain not verified yet — message queued." };
  }
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from, to: [m.to], subject: m.subject, html: m.body }),
    });
    if (!res.ok) return { sent: false, error: `Mail service responded ${res.status}` };
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "Unknown mail error" };
  }
}
