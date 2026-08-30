import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AutarchWordmark } from "@/components/autarch/logo";
import { HeroDiagram } from "@/components/autarch/hero-diagram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

/** Sign-in / sign-up surface backed by real accounts. */
export function AuthPanel({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        await navigate({ to: "/app" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { full_name: name, phone },
          },
        });
        if (error) throw error;
        toast.success("Workspace created. Check your inbox if confirmation is required.");
        await navigate({ to: "/app" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    await navigate({ to: "/app" });
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 ambient-mist opacity-40" />

      <div className="relative flex flex-col justify-center px-6 py-14 sm:px-12">
        <Link to="/" className="mb-10">
          <AutarchWordmark />
        </Link>
        <div className="w-full max-w-sm">
          <h1 className="text-2xl">{isLogin ? "Sign in to Autarch" : "Create your Autarch workspace"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin
              ? "Return to your command center, projects and generation history."
              : "One workspace, 23 capabilities, one project system underneath."}
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="auth-name" className="label-mono">
                    Full name
                  </Label>
                  <Input
                    id="auth-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 font-mono text-xs"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label htmlFor="auth-phone" className="label-mono">
                    Phone number
                  </Label>
                  <Input
                    id="auth-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1.5 font-mono text-xs"
                    placeholder="+91 90000 00000"
                  />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="auth-email" className="label-mono">
                Work email
              </Label>
              <Input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 font-mono text-xs"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <Label htmlFor="auth-password" className="label-mono">
                Password
              </Label>
              <Input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 font-mono text-xs"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full font-mono text-xs">
              {busy ? "Working…" : isLogin ? "Sign in" : "Create workspace"}
            </Button>
          </form>

          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onGoogle}
            className="mt-3 w-full font-mono text-xs"
          >
            Continue with Google
          </Button>

          <div className="mt-6 flex items-center justify-between text-xs">
            <Link to={isLogin ? "/signup" : "/login"} className="underline underline-offset-4">
              {isLogin ? "Create an account" : "I already have an account"}
            </Link>
            <Link to="/app" className="font-mono text-[0.7rem] underline underline-offset-4">
              Explore workspace →
            </Link>
          </div>
        </div>
      </div>

      <div className="relative hidden flex-col justify-center border-l border-border px-12 lg:flex">
        <div className="label-mono mb-6">Request → route → execute → project</div>
        <HeroDiagram className="h-64 w-full text-foreground/60" />
        <p className="mt-8 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Autarch routes a plain-language request to the right capability, executes it under approval gates, and stores
          the output as a project asset you can reuse in any other module.
        </p>
      </div>
    </div>
  );
}
