/**
 * AUTARCH AI — support domain constants shared by client and server.
 */

export const ISSUE_TYPES = [
  { value: "technical", label: "Technical" },
  { value: "billing", label: "Payment / Billing" },
  { value: "account", label: "Login / Account" },
  { value: "network", label: "Network" },
  { value: "module", label: "AI Module" },
  { value: "other", label: "Other" },
] as const;

export const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

export const TICKET_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_user", label: "Waiting for User" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

export const TEAM_ROLES = [
  { value: "agent", label: "Support Agent", blurb: "Sees assigned tickets and can reply." },
  { value: "manager", label: "Support Manager", blurb: "Sees, assigns, replies to and resolves every ticket." },
  { value: "analyst", label: "Read-only Analyst", blurb: "Reads reports only. Cannot reply or change anything." },
] as const;

export const TEAM_STATUSES = ["invited", "active", "suspended", "revoked"] as const;

export const SUPPORT_EMAIL = "hello.autarchai@gmail.com";

export const ISSUE_LABEL = Object.fromEntries(ISSUE_TYPES.map((i) => [i.value, i.label])) as Record<string, string>;
export const PRIORITY_LABEL = Object.fromEntries(PRIORITIES.map((i) => [i.value, i.label])) as Record<string, string>;
export const STATUS_LABEL = Object.fromEntries(TICKET_STATUSES.map((i) => [i.value, i.label])) as Record<string, string>;
export const TEAM_ROLE_LABEL = Object.fromEntries(TEAM_ROLES.map((i) => [i.value, i.label])) as Record<string, string>;

export type IssueType = (typeof ISSUE_TYPES)[number]["value"];
export type TicketPriority = (typeof PRIORITIES)[number]["value"];
export type TicketStatus = (typeof TICKET_STATUSES)[number]["value"];
export type TeamRole = (typeof TEAM_ROLES)[number]["value"];
/** Permission level resolved server-side; "owner" is the account owner / director. */
export type SupportRole = TeamRole | "owner";

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
];

export function canReply(role: SupportRole | null) {
  return role === "owner" || role === "manager" || role === "agent";
}

export function canManageAll(role: SupportRole | null) {
  return role === "owner" || role === "manager";
}

export function statusTone(status: string) {
  switch (status) {
    case "open":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-300";
    case "in_progress":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-300";
    case "waiting_user":
      return "bg-violet-500/10 text-violet-600 dark:text-violet-300";
    case "resolved":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function priorityTone(priority: string) {
  switch (priority) {
    case "urgent":
      return "bg-red-500/10 text-red-600 dark:text-red-300";
    case "high":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-300";
    case "low":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-secondary text-foreground";
  }
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
