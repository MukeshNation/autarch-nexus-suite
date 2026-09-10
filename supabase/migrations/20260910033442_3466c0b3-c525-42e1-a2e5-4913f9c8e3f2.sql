CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  issue_type text NOT NULL DEFAULT 'other',
  priority text NOT NULL DEFAULT 'normal',
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  attachment_path text,
  attachment_name text,
  source text NOT NULL DEFAULT 'public',
  first_response_at timestamptz,
  last_reply_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX support_tickets_user_idx ON public.support_tickets (user_id, created_at DESC);
CREATE INDEX support_tickets_status_idx ON public.support_tickets (status, created_at DESC);
CREATE INDEX support_tickets_email_idx ON public.support_tickets (lower(email), created_at DESC);

CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  author_role text NOT NULL DEFAULT 'user',
  body text NOT NULL,
  internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX support_messages_ticket_idx ON public.support_messages (ticket_id, created_at);

CREATE TABLE public.support_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  team_role text NOT NULL DEFAULT 'agent',
  status text NOT NULL DEFAULT 'invited',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_team_role_check CHECK (team_role IN ('agent','manager','analyst')),
  CONSTRAINT support_team_status_check CHECK (status IN ('invited','active','suspended','revoked'))
);

CREATE UNIQUE INDEX support_team_email_idx ON public.support_team_members (lower(email));

CREATE TABLE public.support_email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  to_email text NOT NULL,
  kind text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

GRANT SELECT ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
GRANT SELECT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
GRANT SELECT ON public.support_team_members TO authenticated;
GRANT ALL ON public.support_team_members TO service_role;
GRANT ALL ON public.support_email_outbox TO service_role;

CREATE OR REPLACE FUNCTION public.support_team_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_staff(_user_id) THEN 'owner'
    ELSE (SELECT team_role FROM public.support_team_members WHERE user_id = _user_id AND status = 'active' LIMIT 1)
  END
$$;

CREATE OR REPLACE FUNCTION public.is_support_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.support_team_role(_user_id) IS NOT NULL
$$;

REVOKE ALL ON FUNCTION public.support_team_role(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_support_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.support_team_role(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_support_staff(uuid) TO authenticated, service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_email_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own tickets"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_support_staff(auth.uid()));

CREATE POLICY "Users read their own ticket messages"
  ON public.support_messages FOR SELECT TO authenticated
  USING (
    public.is_support_staff(auth.uid())
    OR (
      internal = false
      AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
    )
  );

CREATE POLICY "Support staff read team roster"
  ON public.support_team_members FOR SELECT TO authenticated
  USING (public.is_support_staff(auth.uid()) OR user_id = auth.uid());

CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER support_team_members_updated_at
  BEFORE UPDATE ON public.support_team_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();