import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteShell } from "@/components/site/site-shell";
import { Section, SectionHeader } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSupportTicket } from "@/lib/support.functions";
import {
  ALLOWED_ATTACHMENT_TYPES,
  ISSUE_TYPES,
  MAX_ATTACHMENT_BYTES,
  PRIORITIES,
  SUPPORT_EMAIL,
} from "@/lib/support";

const TITLE = "Contact & Support · Autarch AI";
const DESC =
  "Open a support ticket with the Autarch AI team for technical, billing, account, network or capability questions and track it with a ticket ID.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function ContactPage() {
  const submit = useServerFn(createSupportTicket);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ code: string; emailSent: boolean } | null>(null);
  const [issueType, setIssueType] = useState("technical");
  const [priority, setPriority] = useState("normal");
  const [file, setFile] = useState<File | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      let attachment: { name: string; type: string; dataBase64: string } | null = null;
      if (file) {
        if (file.size > MAX_ATTACHMENT_BYTES) throw new Error("Attachment is larger than 5 MB.");
        if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) throw new Error("Use a PNG, JPG, WEBP, GIF, PDF or TXT file.");
        attachment = { name: file.name, type: file.type, dataBase64: await readFile(file) };
      }
      const res = await submit({
        data: {
          full_name: String(form.get("full_name") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
          issue_type: issueType,
          priority,
          subject: String(form.get("subject") ?? ""),
          message: String(form.get("message") ?? ""),
          attachment,
        },
      });
      setDone({ code: res.ticket_code, emailSent: res.emailSent });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send your request.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <SiteShell>
        <Section bordered={false}>
          <div className="mx-auto max-w-xl text-center">
            <h1 className="text-3xl">Your request is in</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Keep this ticket ID — quote it in any follow-up so we can find your conversation instantly.
            </p>
            <div className="panel mt-6 p-6">
              <div className="text-xs text-muted-foreground">Ticket ID</div>
              <div className="mt-1 text-2xl tracking-wide">{done.code}</div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {done.emailSent
                ? "A confirmation was sent to your email address."
                : "Your ticket is saved. Email delivery will begin after the Autarch sender domain is verified."}{" "}
              You can also reach us at {SUPPORT_EMAIL}.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Button asChild size="sm" className="rounded-full">
                <Link to="/app/support">Track in workspace</Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setDone(null)}>
                Send another
              </Button>
            </div>
          </div>
        </Section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <Section bordered={false}>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader
              index="Contact"
              title="Talk to the Autarch support team"
              lead="Technical faults, billing questions, account access, network problems or a capability that is not behaving — open a ticket and you get a tracking ID immediately."
            />
            <div className="panel mt-8 p-6 text-xs leading-relaxed text-muted-foreground">
              <p>
                Support inbox: <span className="text-foreground">{SUPPORT_EMAIL}</span>
              </p>
              <p className="mt-3">
                Urgent tickets are looked at first. Signed-in customers can also read and answer replies inside the
                workspace.
              </p>
            </div>
          </div>

          <form className="panel p-6" onSubmit={onSubmit}>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="full_name">Full name</Label>
                  <Input id="full_name" name="full_name" required minLength={2} className="mt-1.5 text-xs" placeholder="Your name" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required className="mt-1.5 text-xs" placeholder="you@company.com" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" name="phone" className="mt-1.5 text-xs" placeholder="+91…" />
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

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" required minLength={4} className="mt-1.5 text-xs" placeholder="Short summary" />
              </div>

              <div>
                <Label htmlFor="message">Detailed message</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  minLength={20}
                  className="mt-1.5 text-xs"
                  placeholder="What happened, what you expected, and any steps to reproduce…"
                />
              </div>

              <div>
                <Label htmlFor="attachment">Screenshot or file (optional)</Label>
                <Input
                  id="attachment"
                  type="file"
                  accept={ALLOWED_ATTACHMENT_TYPES.join(",")}
                  className="mt-1.5 text-xs"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <p className="mt-1.5 text-[0.65rem] text-muted-foreground">PNG, JPG, WEBP, GIF, PDF or TXT up to 5 MB.</p>
              </div>

              <Button type="submit" disabled={busy} className="w-full rounded-full text-xs">
                {busy ? "Sending…" : "Send request"}
              </Button>
            </div>
          </form>
        </div>
      </Section>
    </SiteShell>
  );
}
