-- ============ 1. Provider secret tables: service_role only ============
GRANT ALL ON public.ai_provider_secrets TO service_role;
GRANT ALL ON public.payment_provider_secrets TO service_role;
ALTER TABLE public.ai_provider_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_provider_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role manages provider secrets" ON public.ai_provider_secrets
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role manages payment secrets" ON public.payment_provider_secrets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============ 2. SECURITY DEFINER helpers: no anon/public EXECUTE ============
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_support_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.support_team_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.spend_credits(integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.refund_credits(integer, text) FROM PUBLIC, anon;

-- ============ 3. is_support_staff inlined (no longer calls support_team_role) ============
CREATE OR REPLACE FUNCTION public.is_support_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_staff(_user_id) OR EXISTS (
    SELECT 1 FROM public.support_team_members
    WHERE user_id = _user_id AND status = 'active'
  )
$$;

-- ============ 4. support_team_role: only the signed-in user's own role ============
CREATE OR REPLACE FUNCTION public.support_team_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN _user_id IS DISTINCT FROM auth.uid() THEN NULL
    WHEN public.is_staff(_user_id) THEN 'owner'
    ELSE (
      SELECT team_role::text FROM public.support_team_members
      WHERE user_id = _user_id AND status = 'active'
      LIMIT 1
    )
  END
$$;

-- ============ 5. refund_credits: only refunds a real, outstanding reservation ============
CREATE OR REPLACE FUNCTION public.refund_credits(_amount integer, _reference text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _new integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;

  -- The reference must match a reservation this user actually made, for this
  -- exact amount. Arbitrary self-refunds are rejected.
  IF NOT EXISTS (
    SELECT 1 FROM public.credit_ledger
    WHERE user_id = _uid
      AND reference_id = _reference
      AND transaction_type = 'reservation'
      AND amount = -_amount
  ) THEN
    RAISE EXCEPTION 'no matching reservation';
  END IF;

  -- Each reference can be refunded at most once.
  IF EXISTS (
    SELECT 1 FROM public.credit_ledger
    WHERE user_id = _uid
      AND reference_id = _reference
      AND transaction_type = 'refund'
  ) THEN
    RAISE EXCEPTION 'already refunded';
  END IF;

  UPDATE public.profiles
     SET credit_balance = credit_balance + _amount,
         updated_at = now()
   WHERE id = _uid
  RETURNING credit_balance INTO _new;

  IF _new IS NULL THEN
    RAISE EXCEPTION 'profile missing';
  END IF;

  INSERT INTO public.credit_ledger (user_id, transaction_type, amount, balance_after, reference_id)
  VALUES (_uid, 'refund', _amount, _new, _reference);

  RETURN _new;
END;
$$;

-- ============ 6. Obsolete email outbox: locked to service_role, deprecated ============
COMMENT ON TABLE public.support_email_outbox IS 'DEPRECATED: unused legacy queue, replaced by Lovable managed email delivery. Locked to service_role only.';
CREATE POLICY "service role legacy outbox" ON public.support_email_outbox
  FOR ALL TO service_role USING (true) WITH CHECK (true);