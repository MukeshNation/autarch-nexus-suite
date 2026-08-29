import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/site-shell";
import { Section, SectionHeader } from "@/components/site/section";

const TITLE = "Company — the team behind Autarch AI";
const DESC =
  "Autarch AI builds one unified enterprise workspace for AI work: specialized surfaces, shared projects, honest capability labels.";

export const Route = createFileRoute("/company")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: CompanyPage,
});

const PRINCIPLES = [
  ["One surface", "A person should learn one workspace, not twenty-three interfaces."],
  ["Honest state", "If something is demo, unavailable or requires a paid service, we label it."],
  ["Human in the loop", "Autonomy is useful only with approval gates and an audit trail."],
  ["Own your output", "Every asset is exportable and attached to a project you control."],
];

function CompanyPage() {
  return (
    <SiteShell>
      <Section bordered={false}>
        <SectionHeader
          index="Company"
          title="We build the workspace, not the hype"
          lead="Autarch AI is an original platform: one composer, 23 specialized capabilities, one project system underneath."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map(([t, d]) => (
            <div key={t} className="panel p-5">
              <h2 className="text-base">{t}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section>
        <SectionHeader index="Status" title="Where the product is today" />
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Phase 1 is the complete product shell: design system, public site, command center, project system UI and all 23
          module workspaces. Authentication, database, storage, AI routing, background jobs, credits and integrations
          arrive in the following phases. Nothing in this build claims a live third-party connection.
        </p>
      </Section>
    </SiteShell>
  );
}
