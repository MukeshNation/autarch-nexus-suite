import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type AutarchProfile = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  account_status: string;
  plan: string;
  credit_balance: number;
  storage_used_bytes: number;
  created_at: string;
  updated_at: string;
};

export type AutarchSubscription = {
  plan: string;
  status: string;
  billing_period: string;
  current_period_end: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: AutarchProfile | null;
  subscription: AutarchSubscription | null;
  avatarUrl: string | null;
  role: "user" | "admin" | "director";
  isAdmin: boolean;
  loading: boolean;
  profileLoading: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  subscription: null,
  avatarUrl: null,
  role: "user",
  isAdmin: false,
  loading: true,
  profileLoading: false,
  profileError: null,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<"user" | "admin" | "director">("user");
  const [profile, setProfile] = useState<AutarchProfile | null>(null);
  const [subscription, setSubscription] = useState<AutarchSubscription | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  // Role check runs against the database, never client storage.
  useEffect(() => {
    if (!userId) {
      setRole("user");
      return;
    }
    let cancelled = false;
    void supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (cancelled) return;
        const roles = (data ?? []).map((r) => r.role as string);
        setRole(roles.includes("admin") ? "admin" : roles.includes("director") ? "director" : "user");
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setSubscription(null);
      setAvatarUrl(null);
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    const [profileRes, subRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("subscriptions")
        .select("plan, status, billing_period, current_period_end")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    if (profileRes.error) setProfileError(profileRes.error.message);
    const next = (profileRes.data as AutarchProfile | null) ?? null;
    setProfile(next);
    setSubscription((subRes.data as AutarchSubscription | null) ?? null);
    if (next?.avatar_url) {
      if (next.avatar_url.startsWith("http")) {
        setAvatarUrl(next.avatar_url);
      } else {
        const { data } = await supabase.storage.from("avatars").createSignedUrl(next.avatar_url, 3600);
        setAvatarUrl(data?.signedUrl ?? null);
      }
    } else {
      setAvatarUrl(null);
    }
    setProfileLoading(false);
  }, [userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  // Presence + page trail so the admin console can show who is live.
  useEffect(() => {
    if (!userId) return;
    void supabase.from("activity_events").insert({ user_id: userId, kind: "page_view", path: pathname });
    void supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
    const interval = window.setInterval(() => {
      void supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [userId, pathname]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      subscription,
      avatarUrl,
      role,
      isAdmin: role === "admin" || role === "director",
      loading,
      profileLoading,
      profileError,
      refreshProfile: loadProfile,
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setSubscription(null);
        setAvatarUrl(null);
      },
    }),
    [session, profile, subscription, avatarUrl, role, loading, profileLoading, profileError, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
