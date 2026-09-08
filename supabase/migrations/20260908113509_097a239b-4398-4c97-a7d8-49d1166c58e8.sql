-- AI provider registry (no secrets here)
CREATE TABLE public.ai_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'llm',
  adapter text not null default 'openai_compatible',
  base_url text,
  model text,
  capabilities text[] not null default '{}',
  enabled boolean not null default true,
  priority integer not null default 100,
  timeout_ms integer not null default 60000,
  max_retries integer not null default 1,
  cost_note text,
  rate_note text,
  notes text,
  has_secret boolean not null default false,
  last_test_status text,
  last_test_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_providers TO authenticated;
GRANT ALL ON public.ai_providers TO service_role;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage providers" ON public.ai_providers FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Secrets: service role only, never reachable from the browser
CREATE TABLE public.ai_provider_secrets (
  provider_id uuid primary key references public.ai_providers(id) on delete cascade,
  api_key text not null,
  updated_at timestamptz not null default now()
);
GRANT ALL ON public.ai_provider_secrets TO service_role;
ALTER TABLE public.ai_provider_secrets ENABLE ROW LEVEL SECURITY;

-- Capability routing
CREATE TABLE public.capability_routes (
  capability text primary key,
  primary_provider_id uuid references public.ai_providers(id) on delete set null,
  fallback_provider_id uuid references public.ai_providers(id) on delete set null,
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.capability_routes TO authenticated;
GRANT ALL ON public.capability_routes TO service_role;
ALTER TABLE public.capability_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage routes" ON public.capability_routes FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Per-module owner controls
CREATE TABLE public.module_settings (
  slug text primary key,
  status text not null default 'coming_soon',
  visible boolean not null default true,
  badge text,
  coming_soon_message text,
  maintenance_message text,
  launch_date date,
  min_plan text not null default 'free',
  credits_per_run integer not null default 1,
  daily_limit integer,
  monthly_limit integer,
  concurrency_limit integer,
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.module_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_settings TO authenticated;
GRANT ALL ON public.module_settings TO service_role;
ALTER TABLE public.module_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "everyone reads module settings" ON public.module_settings FOR SELECT USING (true);
CREATE POLICY "staff write module settings" ON public.module_settings FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update module settings" ON public.module_settings FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff delete module settings" ON public.module_settings FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- Platform safety switches
CREATE TABLE public.platform_flags (
  key text primary key,
  enabled boolean not null default false,
  note text,
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.platform_flags TO anon;
GRANT SELECT, INSERT, UPDATE ON public.platform_flags TO authenticated;
GRANT ALL ON public.platform_flags TO service_role;
ALTER TABLE public.platform_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "everyone reads flags" ON public.platform_flags FOR SELECT USING (true);
CREATE POLICY "staff write flags" ON public.platform_flags FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update flags" ON public.platform_flags FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
INSERT INTO public.platform_flags (key, enabled, note) VALUES
  ('ai_emergency_stop', false, 'Blocks all new AI provider calls'),
  ('payments_disable_checkout', true, 'No payment provider configured yet'),
  ('payments_maintenance', false, 'Temporarily blocks new checkouts');

-- Payment provider configuration (public config only)
CREATE TABLE public.payment_provider_config (
  provider text primary key,
  enabled boolean not null default false,
  environment text not null default 'sandbox',
  key_id text,
  status text not null default 'not_configured',
  webhook_configured boolean not null default false,
  last_event_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE ON public.payment_provider_config TO authenticated;
GRANT ALL ON public.payment_provider_config TO service_role;
ALTER TABLE public.payment_provider_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage payment config" ON public.payment_provider_config FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
INSERT INTO public.payment_provider_config (provider, status) VALUES ('razorpay', 'not_configured');

CREATE TABLE public.payment_provider_secrets (
  provider text primary key,
  api_secret text,
  webhook_secret text,
  updated_at timestamptz not null default now()
);
GRANT ALL ON public.payment_provider_secrets TO service_role;
ALTER TABLE public.payment_provider_secrets ENABLE ROW LEVEL SECURITY;