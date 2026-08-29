import { Link } from "@tanstack/react-router";
import { AutarchWordmark } from "@/components/autarch/logo";
import { HeroDiagram } from "@/components/autarch/hero-diagram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Shared sign-in / sign-up surface. Real auth arrives in Phase 2. */
export function AuthPanel({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";

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

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            {!isLogin && (
              <div>
                <Label htmlFor="auth-name" className="label-mono">
                  Full name
                </Label>
                <Input id="auth-name" className="mt-1.5 font-mono text-xs" placeholder="Your name" />
              </div>
            )}
            <div>
              <Label htmlFor="auth-email" className="label-mono">
                Work email
              </Label>
              <Input id="auth-email" type="email" className="mt-1.5 font-mono text-xs" placeholder="you@company.com" />
            </div>
            <div>
              <Label htmlFor="auth-password" className="label-mono">
                Password
              </Label>
              <Input id="auth-password" type="password" className="mt-1.5 font-mono text-xs" placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full font-mono text-xs">
              {isLogin ? "Sign in" : "Create workspace"}
            </Button>
          </form>

          <p className="mt-4 font-mono text-[0.65rem] text-muted-foreground">
            Authentication is connected in Phase 2. Until then you can explore the workspace directly.
          </p>

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
