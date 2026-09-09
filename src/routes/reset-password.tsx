import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AutarchWordmark } from "@/components/autarch/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const TITLE = "Set a new Autarch AI password";
const DESC = "Choose a new password for your Autarch AI workspace account after a reset request.";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isRecoveryLink = window.location.hash.includes("type=recovery");
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (isRecoveryLink && session)) setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    await navigate({ to: "/app", replace: true });
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-center px-6 py-14 sm:px-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 ambient-mist opacity-40" />
      <div className="relative w-full max-w-sm">
        <Link to="/" className="mb-10 block">
          <AutarchWordmark />
        </Link>
        <h1 className="text-2xl">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ready
            ? "Choose a password you have not used before."
            : "Open this page from the reset link in your email to continue."}
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="rp-password" className="label-mono">
              New password
            </Label>
            <Input
              id="rp-password"
              type="password"
              required
              minLength={8}
              disabled={!ready}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 text-xs"
              placeholder="••••••••"
            />
          </div>
          <div>
            <Label htmlFor="rp-confirm" className="label-mono">
              Confirm new password
            </Label>
            <Input
              id="rp-confirm"
              type="password"
              required
              minLength={8}
              disabled={!ready}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1.5 text-xs"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" disabled={busy || !ready} className="w-full text-xs">
            {busy ? "Updating…" : "Update password"}
          </Button>
          <Link to="/forgot-password" className="block text-xs underline underline-offset-4">
            Request a new link
          </Link>
        </form>
      </div>
    </div>
  );
}
