import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AutarchWordmark } from "@/components/autarch/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const TITLE = "Reset your Autarch AI password";
const DESC = "Request a secure password reset link for your Autarch AI workspace account.";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Reset link sent");
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-center px-6 py-14 sm:px-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 ambient-mist opacity-40" />
      <div className="relative w-full max-w-sm">
        <Link to="/" className="mb-10 block">
          <AutarchWordmark />
        </Link>
        <h1 className="text-2xl">Forgot your password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your account email and we will send a secure link to set a new password.
        </p>

        {sent ? (
          <div className="panel mt-8 space-y-3 p-5">
            <div className="label-mono">Link sent</div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              If an account exists for <span className="font-mono">{email}</span>, a reset link is on its way. The link
              opens the reset page where you choose a new password.
            </p>
            <Button asChild variant="outline" className="w-full text-xs">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="fp-email" className="label-mono">
                Account email
              </Label>
              <Input
                id="fp-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 text-xs"
                placeholder="you@company.com"
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full text-xs">
              {busy ? "Sending…" : "Send reset link"}
            </Button>
            <Link to="/login" className="block text-xs underline underline-offset-4">
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
