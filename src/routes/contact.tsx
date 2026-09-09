import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/site-shell";
import { Section, SectionHeader } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TITLE = "Contact Autarch AI";
const DESC = "Talk to the Autarch team about the workspace, capability availability, security review or enterprise rollout.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <SiteShell>
      <Section bordered={false}>
        <div className="grid gap-10 lg:grid-cols-2">
          <SectionHeader
            index="Contact"
            title="Tell us what you need Autarch to run"
            lead="Security review, capability roadmap, or a rollout across a team — start here."
          />
          <form
            className="panel p-6"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="label-mono">
                  Name
                </Label>
                <Input id="name" className="mt-1.5 text-xs" placeholder="Your name" />
              </div>
              <div>
                <Label htmlFor="email" className="label-mono">
                  Work email
                </Label>
                <Input id="email" type="email" className="mt-1.5 text-xs" placeholder="you@company.com" />
              </div>
              <div>
                <Label htmlFor="message" className="label-mono">
                  What do you want Autarch to do?
                </Label>
                <Textarea id="message" rows={5} className="mt-1.5 text-xs" placeholder="Describe the workload…" />
              </div>
              <Button type="submit" className="w-full text-xs">
                Send message
              </Button>
              <p className="text-[0.65rem] text-muted-foreground">
                Form delivery is connected in a later phase — nothing is submitted yet.
              </p>
            </div>
          </form>
        </div>
      </Section>
    </SiteShell>
  );
}
