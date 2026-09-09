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

function passwordScore(value: string) {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 4);
}

const STRENGTH_LABEL = ["Too weak", "Weak", "Fair", "Strong", "Very strong"] as const;

/** Sign-in / sign-up surface backed by real accounts. */
export function AuthPanel({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pendingConfirm, setPendingConfirm] = useState(false);

  const score = passwordScore(password);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLogin) {
      if (name.trim().length < 2) {
        toast.error("Please enter your full name");
        return;
      }
      if (score < 2) {
        toast.error("Choose a stronger password (8+ chars, mixed case, a number)");
        return;
      }
      if (password !== confirm) {
        toast.error("Passwords do not match");
        return;
      }
    }
    setBusy(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (/invalid login credentials/i.test(error.message)) {
            throw new Error("Email or password is incorrect");
          }
          if (/email not confirmed/i.test(error.message)) {
            throw new Error("Confirm your email first — check your inbox");
          }
          throw error;
        }
        toast.success("Signed in");
        await navigate({ to: "/app" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { full_name: name.trim(), phone: phone.trim() },
          },
        });
        if (error) {
          if (/already registered|already exists|User already/i.test(error.message)) {
            throw new Error("An account with this email already exists — sign in instead");
          }
          throw error;
        }
        if (!data.session) {
          setPendingConfirm(true);
          toast.success("Check your email to confirm your account");
          return;
        }
        toast.success("Workspace created");
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

          {pendingConfirm ? (
            <div className="panel mt-8 space-y-3 p-5">
              <div className="label-mono">Confirm your email</div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                We sent a confirmation link to <span className="font-mono">{email}</span>. Open it to activate your
                Autarch workspace, then sign in.
              </p>
              <Button asChild variant="outline" className="w-full text-xs">
                <Link to="/login">Go to sign in</Link>
              </Button>
            </div>
          ) : (
            <>
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
                        className="mt-1.5 text-xs"
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
                        className="mt-1.5 text-xs"
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
                    className="mt-1.5 text-xs"
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
                    minLength={isLogin ? 6 : 8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5 text-xs"
                    placeholder="••••••••"
                  />
                  {!isLogin && password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <span
                            key={i}
                            className={
                              i < score
                                ? "h-1 flex-1 rounded-full bg-primary"
                                : "h-1 flex-1 rounded-full bg-border"
                            }
                          />
                        ))}
                      </div>
                      <span className="label-mono mt-1 block">{STRENGTH_LABEL[score]}</span>
                    </div>
                  )}
                </div>
                {!isLogin && (
                  <div>
                    <Label htmlFor="auth-confirm" className="label-mono">
                      Confirm password
                    </Label>
                    <Input
                      id="auth-confirm"
                      type="password"
                      required
                      minLength={8}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="mt-1.5 text-xs"
                      placeholder="••••••••"
                    />
                    {confirm.length > 0 && confirm !== password && (
                      <span className="mt-1 block text-[0.65rem] text-destructive">
                        Passwords do not match
                      </span>
                    )}
                  </div>
                )}
                <Button type="submit" disabled={busy} className="w-full text-xs">
                  {busy ? "Working…" : isLogin ? "Sign in" : "Create workspace"}
                </Button>
              </form>

              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={onGoogle}
                className="mt-3 w-full text-xs"
              >
                Continue with Google
              </Button>

              <div className="mt-6 flex items-center justify-between text-xs">
                <Link to={isLogin ? "/signup" : "/login"} className="underline underline-offset-4">
                  {isLogin ? "Create an account" : "I already have an account"}
                </Link>
                <Link to="/forgot-password" className="text-[0.7rem] underline underline-offset-4">
                  Forgot password?
                </Link>
              </div>
            </>
          )}
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
