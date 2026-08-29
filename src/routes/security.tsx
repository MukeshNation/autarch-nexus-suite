import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/site-shell";
import { Section, SectionHeader } from "@/components/site/section";

const TITLE = "Security — how Autarch AI protects your workspace";
const DESC =
  "Server-side authorization, private file access, input validation, rate limiting, webhook verification and audit logs across the Autarch workspace.";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: SecurityPage,
});

const CONTROLS = [
  ["Server-side authorization", "Ownership and permission checks run on the server. Client state can never widen access."],
  ["Private file access", "Uploads are scoped to their owner and served through signed, expiring access."],
  ["Input validation", "Every request and upload is schema-validated and size/type checked."],
  ["Secret handling", "Provider credentials live server-side only; never in frontend code."],
  ["Rate limiting", "Per-user and per-endpoint limits protect against abuse and runaway cost."],
  ["Webhook verification", "Inbound provider callbacks are signature-verified before processing."],
  ["Isolated execution", "Generated code runs in an isolated sandbox, never against your workspace."],
  ["Audit logs", "Who asked, what ran, what it produced, and what it consumed."],
];

function SecurityPage() {
  return (
    <SiteShell>
      <Section bordered={false}>
        <SectionHeader
          index="Security"
          title="Designed so one user can never reach another user's data"
          lead="These are the controls the architecture is built around. Enforcement lands with the backend phases; this page describes intent, not a certification."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {CONTROLS.map(([t, d]) => (
            <div key={t} className="panel p-5">
              <h2 className="text-base">{t}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section>
        <SectionHeader index="Consent" title="Likeness, voice and mailbox access" />
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Voice replication, portrait generation and avatar video require documented consent from the person depicted.
          Email, social and CRM capabilities operate only through accounts you explicitly authorize, and any outbound
          action requires per-item approval.
        </p>
      </Section>
    </SiteShell>
  );
}
