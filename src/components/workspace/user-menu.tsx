import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Settings, ShieldCheck, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

function initials(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.split("@")[0] || "A";
  return source
    .split(/[\s._-]+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

/** Session-aware account affordance for the workspace header. */
export function UserMenu({ className }: { className?: string }) {
  const { user, profile, avatarUrl, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (loading) return <div className={className} aria-hidden="true" />;

  if (!user) {
    return (
      <Button asChild size="sm" variant="outline" className="text-[0.7rem]">
        <a href="/login">Sign in</a>
      </Button>
    );
  }

  const label = profile?.display_name || profile?.full_name || user.email;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    await navigate({ to: "/login", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md border border-border px-1.5 py-1 hover:bg-secondary"
          aria-label="Account menu"
        >
          <Avatar className="size-6">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback className="text-[0.6rem]">
              {initials(profile?.display_name ?? profile?.full_name, user.email)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[8rem] truncate text-[0.68rem] sm:inline">{label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[0.68rem]">
          <span className="block truncate">{label}</span>
          <span className="block truncate text-[0.62rem] font-normal text-muted-foreground">{user.email}</span>
          <span className="mt-1 block text-[0.62rem] font-normal text-muted-foreground">
            Plan: {profile?.plan ?? "free"} · Credits: {profile?.credit_balance ?? 0}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void navigate({ to: "/app/settings" })} className="text-xs">
          <UserIcon className="size-3.5" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void navigate({ to: "/app/billing" })} className="text-xs">
          <Settings className="size-3.5" /> Billing
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem onSelect={() => void navigate({ to: "/admin" })} className="text-xs">
            <ShieldCheck className="size-3.5" /> Admin console
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()} className="text-xs">
          <LogOut className="size-3.5" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
