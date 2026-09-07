import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type UsageEvent = Database["public"]["Tables"]["usage_events"]["Row"];
export type LedgerEntry = Database["public"]["Tables"]["credit_ledger"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

export function useAccountOverview() {
  return useQuery({
    queryKey: ["account-overview"],
    queryFn: async () => {
      const [{ data: profile }, { data: subscription }] = await Promise.all([
        supabase.from("profiles").select("*").maybeSingle(),
        supabase
          .from("subscriptions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      return { profile: profile ?? null, subscription: (subscription as Subscription | null) ?? null };
    },
  });
}

export function useUsageEvents() {
  return useQuery({
    queryKey: ["usage-events"],
    queryFn: async (): Promise<UsageEvent[]> => {
      const { data, error } = await supabase
        .from("usage_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLedger() {
  return useQuery({
    queryKey: ["credit-ledger"],
    queryFn: async (): Promise<LedgerEntry[]> => {
      const { data, error } = await supabase
        .from("credit_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function groupUsageByModule(events: UsageEvent[]) {
  const map = new Map<string, number>();
  for (const e of events) {
    const key = e.module_id ?? "other";
    map.set(key, (map.get(key) ?? 0) + (e.credits_used ?? 0));
  }
  return [...map.entries()].map(([id, credits]) => ({ id, credits })).sort((a, b) => b.credits - a.credits);
}
