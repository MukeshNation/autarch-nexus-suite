/**
 * AUTARCH AI — Contact & Support server functions.
 *
 * Public ticket creation is validated, rate limited and written server-side.
 * Every staff action verifies the caller's support role on the server; the
 * browser never receives credentials, provider keys or payment secrets.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ALLOWED_ATTACHMENT_TYPES,
  ISSUE_TYPES,
  MAX_ATTACHMENT_BYTES,
  PRIORITIES,
  SUPPORT_EMAIL,
  TEAM_ROLES,
  TEAM_ROLE_LABEL,
  TICKET_STATUSES,
  type SupportRole,
} from "./support";

async function mailer() {
  return import("./support-email.server");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function audit(actorId: string | null, action: string, resourceId: string | null, metadata: Record<string, unknown>) {
  const db = await admin();
  await db.from("audit_logs").insert({
    actor_id: actorId,
    action,
    resource_type: "support",
    resource_id: resourceId,
    metadata,
  } as never);
}

/* --------------------------------------------------------------- ticket types */

export type SupportTicket = {
  id: string;
  ticket_code: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  issue_type: string;
  priority: string;
  subject: string;
  message: string;
  status: string;
  assigned_to: string | null;
  assigned_name: string | null;
  attachment_name: string | null;
  first_response_at: string | null;
  last_reply_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SupportMessage = {
  id: string;
  author_name: string | null;
  author_role: string;
  body: string;
  internal: boolean;
  created_at: string;
};

/* ------------------------------------------------------------ public creation */

const AttachmentInput = z
  .object({
    name: z.string().min(1).max(200),
    type: z.string().min(3).max(120),
    dataBase64: z.string().min(4).max(9_000_000),
  })
  .nullable()
  .optional();

const TicketInput = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  issue_type: z.enum(ISSUE_TYPES.map((i) => i.value) as [string, ...string[]]),
  priority: z.enum(PRIORITIES.map((i) => i.value) as [string, ...string[]]),
  subject: z.string().trim().min(4).max(160),
  message: z.string().trim().min(20).max(6000),
  attachment: AttachmentInput,
});

function ticketCode() {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  for (let i = 0; i < 5; i += 1) tail += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `AUT-${stamp}-${tail}`;
}

export const createSupportTicket = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TicketInput.parse(input))
  .handler(async ({ data }): Promise<{ ticket_code: string; emailSent: boolean }> => {
    const db = await admin();
    const email = data.email.toLowerCase();

    // Spam guard: at most 3 tickets per email per hour, 6 per day.
    const hourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const [{ count: recentHour }, { count: recentDay }] = await Promise.all([
      db.from("support_tickets").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", hourAgo),
      db.from("support_tickets").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", dayAgo),
    ]);
    if ((recentHour ?? 0) >= 3) throw new Error("You have already sent several requests in the last hour. Please reply to your existing ticket instead.");
    if ((recentDay ?? 0) >= 6) throw new Error("Daily request limit reached for this email address. Please reply on an existing ticket.");

    let attachmentPath: string | null = null;
    let attachmentName: string | null = null;
    if (data.attachment) {
      if (!ALLOWED_ATTACHMENT_TYPES.includes(data.attachment.type)) {
        throw new Error("That file type is not accepted. Use PNG, JPG, WEBP, GIF, PDF or TXT.");
      }
      const raw = data.attachment.dataBase64.includes(",")
        ? data.attachment.dataBase64.slice(data.attachment.dataBase64.indexOf(",") + 1)
        : data.attachment.dataBase64;
      const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      if (bytes.byteLength > MAX_ATTACHMENT_BYTES) throw new Error("Attachment is larger than 5 MB.");
      const safeName = data.attachment.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-80);
      const path = `${new Date().getUTCFullYear()}/${crypto.randomUUID()}-${safeName}`;
      const { error } = await db.storage
        .from("support-attachments")
        .upload(path, bytes, { contentType: data.attachment.type, upsert: false });
      if (error) throw new Error("Could not store the attachment. Try again without the file.");
      attachmentPath = path;
      attachmentName = safeName;
    }

    let ticket: any = null;
    for (let attempt = 0; attempt < 4 && !ticket; attempt += 1) {
      const { data: created } = await db
        .from("support_tickets")
        .insert({
          ticket_code: ticketCode(),
          full_name: data.full_name,
          email,
          phone: data.phone ? data.phone : null,
          issue_type: data.issue_type,
          priority: data.priority,
          subject: data.subject,
          message: data.message,
          attachment_path: attachmentPath,
          attachment_name: attachmentName,
          source: "public",
        } as never)
        .select("*")
        .maybeSingle();
      ticket = created;
    }
    if (!ticket) throw new Error("Could not open the ticket. Please try again.");

    await db.from("support_messages").insert({
      ticket_id: ticket.id,
      author_name: data.full_name,
      author_role: "user",
      body: data.message,
    } as never);

    const { ownerNotification, sendSupportEmails, userConfirmation } = await mailer();
    const emailSent = await sendSupportEmails(ticket.id, [ownerNotification(ticket), userConfirmation(ticket)]);

    await audit(null, "support.ticket_created", ticket.id, { ticket_code: ticket.ticket_code, issue_type: data.issue_type });
    return { ticket_code: ticket.ticket_code as string, emailSent };
  });

/* -------------------------------------------------------------- user surface */

export const listMyTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SupportTicket[]> => {
    const db = await admin();
    const { data: profile } = await context.supabase.from("profiles").select("email").eq("id", context.userId).maybeSingle();
    const email = (profile?.email as string | null)?.toLowerCase() ?? null;

    let query = db.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(200);
    query = email ? query.or(`user_id.eq.${context.userId},email.eq.${email}`) : query.eq("user_id", context.userId);
    const { data } = await query;
    return (data ?? []).map(shapeTicket);
  });

export const createMyTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    TicketInput.omit({ full_name: true, email: true }).extend({ full_name: z.string().trim().min(2).max(120).optional() }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ticket_code: string }> => {
    const db = await admin();
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("full_name, display_name, email, phone")
      .eq("id", context.userId)
      .maybeSingle();
    const email = (profile?.email as string | null) ?? (context.claims as any)?.email ?? "";
    if (!email) throw new Error("Your account has no email address on file.");

    const hourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
    const { count } = await db
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .gte("created_at", hourAgo);
    if ((count ?? 0) >= 5) throw new Error("You have opened several tickets in the last hour. Reply on an existing ticket instead.");

    let attachmentPath: string | null = null;
    let attachmentName: string | null = null;
    if (data.attachment) {
      const uploaded = await uploadAttachment(db, data.attachment);
      attachmentPath = uploaded.path;
      attachmentName = uploaded.name;
    }

    let ticket: any = null;
    for (let attempt = 0; attempt < 4 && !ticket; attempt += 1) {
      const { data: created } = await db
        .from("support_tickets")
        .insert({
          ticket_code: ticketCode(),
          user_id: context.userId,
          full_name: data.full_name || (profile?.full_name as string) || (profile?.display_name as string) || "Autarch user",
          email: String(email).toLowerCase(),
          phone: data.phone ? data.phone : ((profile?.phone as string | null) ?? null),
          issue_type: data.issue_type,
          priority: data.priority,
          subject: data.subject,
          message: data.message,
          attachment_path: attachmentPath,
          attachment_name: attachmentName,
          source: "workspace",
        } as never)
        .select("*")
        .maybeSingle();
      ticket = created;
    }
    if (!ticket) throw new Error("Could not open the ticket. Please try again.");

    await db.from("support_messages").insert({
      ticket_id: ticket.id,
      author_id: context.userId,
      author_name: ticket.full_name,
      author_role: "user",
      body: data.message,
    } as never);
    const { ownerNotification, sendSupportEmails, userConfirmation } = await mailer();
    await sendSupportEmails(ticket.id, [ownerNotification(ticket), userConfirmation(ticket)]);
    await audit(context.userId, "support.ticket_created", ticket.id, { ticket_code: ticket.ticket_code });
    return { ticket_code: ticket.ticket_code as string };
  });

export const getMyTicketThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ ticketId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }): Promise<{ ticket: SupportTicket; messages: SupportMessage[]; attachmentUrl: string | null }> => {
    const db = await admin();
    const ticket = await ownedTicket(db, context, data.ticketId);
    const { data: messages } = await db
      .from("support_messages")
      .select("id, author_name, author_role, body, internal, created_at")
      .eq("ticket_id", ticket.id)
      .eq("internal", false)
      .order("created_at", { ascending: true });
    let attachmentUrl: string | null = null;
    if (ticket.attachment_path) {
      const { data: signed } = await db.storage.from("support-attachments").createSignedUrl(ticket.attachment_path, 600);
      attachmentUrl = signed?.signedUrl ?? null;
    }
    return { ticket: shapeTicket(ticket), messages: (messages ?? []) as SupportMessage[], attachmentUrl };
  });

export const replyToMyTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ ticketId: z.string().uuid(), body: z.string().trim().min(2).max(6000) }).parse(i))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const ticket = await ownedTicket(db, context, data.ticketId);
    if (ticket.status === "closed") throw new Error("This ticket is closed. Please open a new one.");
    await db.from("support_messages").insert({
      ticket_id: ticket.id,
      author_id: context.userId,
      author_name: ticket.full_name,
      author_role: "user",
      body: data.body,
    } as never);
    await db
      .from("support_tickets")
      .update({ status: ticket.status === "resolved" ? "open" : ticket.status === "waiting_user" ? "in_progress" : ticket.status, last_reply_at: new Date().toISOString() } as never)
      .eq("id", ticket.id);
    return { ok: true };
  });

async function ownedTicket(db: any, context: { supabase: any; userId: string }, ticketId: string) {
  const { data: profile } = await context.supabase.from("profiles").select("email").eq("id", context.userId).maybeSingle();
  const { data: ticket } = await db.from("support_tickets").select("*").eq("id", ticketId).maybeSingle();
  if (!ticket) throw new Error("Ticket not found.");
  const email = (profile?.email as string | null)?.toLowerCase() ?? null;
  const mine = ticket.user_id === context.userId || (email && String(ticket.email).toLowerCase() === email);
  if (!mine) throw new Error("Ticket not found.");
  return ticket;
}

/* -------------------------------------------------------------- staff access */

async function requireSupportRole(context: { supabase: any; userId: string }): Promise<SupportRole> {
  const { data } = await context.supabase.rpc("support_team_role", { _user_id: context.userId });
  const role = (data as string | null) ?? null;
  if (!role) throw new Error("Forbidden");
  return role as SupportRole;
}

async function uploadAttachment(db: any, attachment: z.infer<typeof AttachmentInput> & {}) {
  if (!ALLOWED_ATTACHMENT_TYPES.includes(attachment.type)) {
    throw new Error("That file type is not accepted. Use PNG, JPG, WEBP, GIF, PDF or TXT.");
  }
  const raw = attachment.dataBase64.includes(",")
    ? attachment.dataBase64.slice(attachment.dataBase64.indexOf(",") + 1)
    : attachment.dataBase64;
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  if (bytes.byteLength > MAX_ATTACHMENT_BYTES) throw new Error("Attachment is larger than 5 MB.");
  const name = attachment.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-80);
  const path = `${new Date().getUTCFullYear()}/${crypto.randomUUID()}-${name}`;
  const { error } = await db.storage.from("support-attachments").upload(path, bytes, {
    contentType: attachment.type,
    upsert: false,
  });
  if (error) throw new Error("Could not store the attachment. Try again without the file.");
  return { path, name };
}

export const getSupportRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ role: SupportRole | null }> => {
    const { data } = await context.supabase.rpc("support_team_role", { _user_id: context.userId });
    return { role: ((data as string | null) ?? null) as SupportRole | null };
  });

function shapeTicket(row: any): SupportTicket {
  return {
    id: row.id,
    ticket_code: row.ticket_code,
    user_id: row.user_id ?? null,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone ?? null,
    issue_type: row.issue_type,
    priority: row.priority,
    subject: row.subject,
    message: row.message,
    status: row.status,
    assigned_to: row.assigned_to ?? null,
    assigned_name: row.assigned_name ?? null,
    attachment_name: row.attachment_name ?? null,
    first_response_at: row.first_response_at ?? null,
    last_reply_at: row.last_reply_at ?? null,
    resolved_at: row.resolved_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export type SupportMetrics = {
  open: number;
  urgent: number;
  pending: number;
  resolvedToday: number;
  avgResponseMinutes: number | null;
  workload: Array<{ name: string; email: string; role: string; open: number }>;
};

export const listSupportTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        search: z.string().trim().max(120).optional(),
        status: z.string().max(30).optional(),
        priority: z.string().max(20).optional(),
        issue_type: z.string().max(30).optional(),
        assigned: z.string().max(60).optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ role: SupportRole; tickets: SupportTicket[]; metrics: SupportMetrics; team: TeamMember[] }> => {
    const role = await requireSupportRole(context);
    const db = await admin();

    let query = db.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(400);
    if (role === "agent") query = query.eq("assigned_to", context.userId);
    if (data.status && data.status !== "all") query = query.eq("status", data.status);
    if (data.priority && data.priority !== "all") query = query.eq("priority", data.priority);
    if (data.issue_type && data.issue_type !== "all") query = query.eq("issue_type", data.issue_type);
    if (data.assigned === "unassigned") query = query.is("assigned_to", null);
    else if (data.assigned && data.assigned !== "all") query = query.eq("assigned_to", data.assigned);
    if (data.search) {
      const s = data.search.replace(/[%,()]/g, "");
      query = query.or(`ticket_code.ilike.%${s}%,email.ilike.%${s}%,full_name.ilike.%${s}%,subject.ilike.%${s}%`);
    }
    const { data: rows } = await query;
    const team = await loadTeam(db);
    const nameFor = new Map(team.map((m) => [m.user_id, m.full_name || m.email]));

    const tickets = (rows ?? []).map((r: any) => ({
      ...shapeTicket(r),
      assigned_name: r.assigned_to ? (nameFor.get(r.assigned_to) ?? "Owner") : null,
    }));

    const { data: all } = await db.from("support_tickets").select("status, priority, assigned_to, created_at, first_response_at, resolved_at");
    const startToday = new Date();
    startToday.setUTCHours(0, 0, 0, 0);
    const list = all ?? [];
    const responded = list.filter((t: any) => t.first_response_at);
    const workloadMap = new Map<string, number>();
    for (const t of list) {
      if (["open", "in_progress", "waiting_user"].includes(t.status) && t.assigned_to) {
        workloadMap.set(t.assigned_to, (workloadMap.get(t.assigned_to) ?? 0) + 1);
      }
    }

    const metrics: SupportMetrics = {
      open: list.filter((t: any) => t.status === "open").length,
      urgent: list.filter((t: any) => t.priority === "urgent" && !["resolved", "closed"].includes(t.status)).length,
      pending: list.filter((t: any) => ["in_progress", "waiting_user"].includes(t.status)).length,
      resolvedToday: list.filter((t: any) => t.resolved_at && t.resolved_at >= startToday.toISOString()).length,
      avgResponseMinutes: responded.length
        ? Math.round(
            responded.reduce(
              (sum: number, t: any) => sum + (new Date(t.first_response_at).getTime() - new Date(t.created_at).getTime()) / 60_000,
              0,
            ) / responded.length,
          )
        : null,
      workload: team
        .filter((m) => m.user_id)
        .map((m) => ({ name: m.full_name || m.email, email: m.email, role: m.team_role, open: workloadMap.get(m.user_id!) ?? 0 })),
    };

    return { role, tickets, metrics, team };
  });

export const getSupportThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ ticketId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }): Promise<{ role: SupportRole; messages: SupportMessage[]; attachmentUrl: string | null }> => {
    const role = await requireSupportRole(context);
    const db = await admin();
    const { data: ticket } = await db.from("support_tickets").select("assigned_to, attachment_path").eq("id", data.ticketId).maybeSingle();
    if (!ticket) throw new Error("Ticket not found.");
    if (role === "agent" && ticket.assigned_to !== context.userId) throw new Error("Forbidden");
    const { data: messages } = await db
      .from("support_messages")
      .select("id, author_name, author_role, body, internal, created_at")
      .eq("ticket_id", data.ticketId)
      .order("created_at", { ascending: true });
    let attachmentUrl: string | null = null;
    if (ticket.attachment_path) {
      const { data: signed } = await db.storage.from("support-attachments").createSignedUrl(ticket.attachment_path, 600);
      attachmentUrl = signed?.signedUrl ?? null;
    }
    return { role, messages: (messages ?? []) as SupportMessage[], attachmentUrl };
  });

export const staffReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ ticketId: z.string().uuid(), body: z.string().trim().min(2).max(6000), internal: z.boolean().default(false) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const role = await requireSupportRole(context);
    if (role === "analyst") throw new Error("Read-only analysts cannot reply.");
    const db = await admin();
    const { data: ticket } = await db.from("support_tickets").select("*").eq("id", data.ticketId).maybeSingle();
    if (!ticket) throw new Error("Ticket not found.");
    if (role === "agent" && ticket.assigned_to !== context.userId) throw new Error("Forbidden");

    const { data: profile } = await context.supabase.from("profiles").select("full_name, display_name").eq("id", context.userId).maybeSingle();
    const authorName = (profile?.full_name as string) || (profile?.display_name as string) || "Autarch Support";

    await db.from("support_messages").insert({
      ticket_id: ticket.id,
      author_id: context.userId,
      author_name: authorName,
      author_role: data.internal ? "internal" : "staff",
      body: data.body,
      internal: data.internal,
    } as never);

    if (!data.internal) {
      const patch: Record<string, unknown> = { last_reply_at: new Date().toISOString() };
      if (!ticket.first_response_at) patch["first_response_at"] = new Date().toISOString();
      if (ticket.status === "open") patch["status"] = "in_progress";
      await db.from("support_tickets").update(patch as never).eq("id", ticket.id);
      const { sendSupportEmails, staffReplyNotice } = await mailer();
      await sendSupportEmails(ticket.id, [staffReplyNotice(ticket, data.body)]);
    }
    await audit(context.userId, data.internal ? "support.internal_note" : "support.reply_sent", ticket.id, {
      ticket_code: ticket.ticket_code,
      role,
    });
    return { ok: true };
  });

export const updateSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        ticketId: z.string().uuid(),
        status: z.enum(TICKET_STATUSES.map((s) => s.value) as [string, ...string[]]).optional(),
        priority: z.enum(PRIORITIES.map((p) => p.value) as [string, ...string[]]).optional(),
        assigned_to: z.string().uuid().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const role = await requireSupportRole(context);
    if (role === "analyst") throw new Error("Read-only analysts cannot change tickets.");
    const db = await admin();
    const { data: ticket } = await db.from("support_tickets").select("*").eq("id", data.ticketId).maybeSingle();
    if (!ticket) throw new Error("Ticket not found.");
    if (role === "agent") {
      if (ticket.assigned_to !== context.userId) throw new Error("Forbidden");
      if (data.assigned_to !== undefined) throw new Error("Only a support manager can assign tickets.");
    }

    const patch: Record<string, unknown> = {};
    if (data.status) {
      patch["status"] = data.status;
      patch["resolved_at"] = data.status === "resolved" ? new Date().toISOString() : null;
      patch["closed_at"] = data.status === "closed" ? new Date().toISOString() : null;
    }
    if (data.priority) patch["priority"] = data.priority;
    if (data.assigned_to !== undefined) patch["assigned_to"] = data.assigned_to;
    if (Object.keys(patch).length === 0) return { ok: true };
    await db.from("support_tickets").update(patch as never).eq("id", ticket.id);
    await audit(context.userId, "support.ticket_updated", ticket.id, { ticket_code: ticket.ticket_code, ...patch, role });
    return { ok: true };
  });

/* ---------------------------------------------------------- team management */

export type TeamMember = {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  team_role: string;
  status: string;
  created_at: string;
};

async function loadTeam(db: any): Promise<TeamMember[]> {
  const { data } = await db.from("support_team_members").select("*").order("created_at", { ascending: true });
  return (data ?? []) as TeamMember[];
}

async function requireOwner(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (data !== true) throw new Error("Only the owner can manage the support team.");
}

export const listSupportTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ members: TeamMember[]; auditTrail: Array<{ id: string; action: string; created_at: string; metadata: any }> }> => {
    await requireOwner(context);
    const db = await admin();
    const members = await loadTeam(db);
    const { data: logs } = await db
      .from("audit_logs")
      .select("id, action, created_at, metadata")
      .eq("resource_type", "support")
      .order("created_at", { ascending: false })
      .limit(60);
    return { members, auditTrail: (logs ?? []) as never };
  });

export const inviteSupportMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(200),
        full_name: z.string().trim().max(120).optional(),
        team_role: z.enum(TEAM_ROLES.map((r) => r.value) as [string, ...string[]]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context);
    const db = await admin();
    const email = data.email.toLowerCase();
    if (email === SUPPORT_EMAIL) throw new Error("That address is the support inbox itself.");

    // Link the account immediately when it already exists.
    const { data: profile } = await db.from("profiles").select("id, full_name").eq("email", email).maybeSingle();
    const { error } = await db.from("support_team_members").upsert(
      {
        email,
        full_name: data.full_name || (profile?.full_name as string | null) || null,
        team_role: data.team_role,
        user_id: profile?.id ?? null,
        status: profile?.id ? "active" : "invited",
        invited_by: context.userId,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "email" },
    );
    if (error) throw new Error("Could not add that team member.");
    const { sendSupportEmails, teamInvite } = await mailer();
    await sendSupportEmails(null, [teamInvite(email, TEAM_ROLE_LABEL[data.team_role] ?? data.team_role)]);
    await audit(context.userId, "support.team_invited", null, { email, team_role: data.team_role });
    return { ok: true, linked: Boolean(profile?.id) };
  });

export const updateSupportMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["invited", "active", "suspended", "revoked"]).optional(),
        team_role: z.enum(TEAM_ROLES.map((r) => r.value) as [string, ...string[]]).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context);
    const db = await admin();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.status) patch["status"] = data.status;
    if (data.team_role) patch["team_role"] = data.team_role;
    await db.from("support_team_members").update(patch as never).eq("id", data.id);
    await audit(context.userId, "support.team_updated", data.id, { ...patch });
    return { ok: true };
  });

export const removeSupportMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireOwner(context);
    const db = await admin();
    const { data: member } = await db.from("support_team_members").select("email").eq("id", data.id).maybeSingle();
    await db.from("support_team_members").delete().eq("id", data.id);
    await audit(context.userId, "support.team_removed", data.id, { email: member?.email ?? null });
    return { ok: true };
  });
