import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/site-shell";
import { Section, SectionHeader } from "@/components/site/section";

const TITLE = "Resources — guides for the Autarch workspace";
const DESC =
  "Learn how capability routing, background jobs, credits, projects and approval gates work inside the Autarch AI workspace.";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: ResourcesPage,
});

const GUIDES = [
  ["Composer basics", "Write a request, attach files, let Autarch pick the capability."],
  ["Capability routing", "How intent maps to one of 23 module workspaces, and how to override it."],
  ["Background jobs", "Why long media and build work continues after you close the tab."],
  ["Credits & metering", "Reservation, execution, usage recording and finalisation."],
  ["Projects as memory", "Attaching every asset to a project, task and owner."],
  ["Approval gates", "Nothing external happens without an authorized account and a confirmation."],
];

function ResourcesPage() {
  return (
    <SiteShell>
      <Section bordered={false}>
        <SectionHeader index="Resources" title="How Autarch works" lead="Short, practical explanations of the platform mechanics." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map(([t, d]) => (
            <article key={t} className="panel hover-lift p-5">
              <h2 className="text-base">{t}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{d}</p>
              <div className="label-mono mt-4">Guide</div>
            </article>
          ))}
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          Looking for the working surface?{" "}
          <Link to="/app" className="underline underline-offset-4">
            Open the command center
          </Link>
          .
        </p>
      </Section>
    </SiteShell>
  );
}
