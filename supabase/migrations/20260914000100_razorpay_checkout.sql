CREATE TABLE IF NOT EXISTS public.payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'razorpay',
  provider_order_id text UNIQUE,
  provider_payment_id text,
  plan text NOT NULL,
  amount_minor integer NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'creating',
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_orders_user_idx
  ON public.payment_orders(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error text
);

GRANT SELECT ON public.payment_orders TO authenticated;
GRANT ALL ON public.payment_orders TO service_role;
GRANT ALL ON public.payment_webhook_events TO service_role;

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own payment orders"
  ON public.payment_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TRIGGER payment_orders_updated_at
  BEFORE UPDATE ON public.payment_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.activate_paid_plan(
  _user_id uuid,
  _plan text,
  _payment_id text,
  _credits integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _balance integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;

  UPDATE public.subscriptions
  SET status = 'inactive', updated_at = now()
  WHERE user_id = _user_id AND status = 'active';

  INSERT INTO public.subscriptions (
    user_id, plan, status, granted_free, started_at,
    expires_at, current_period_start, current_period_end
  ) VALUES (
    _user_id, _plan, 'active', false, now(),
    now() + interval '30 days', now(), now() + interval '30 days'
  );

  UPDATE public.profiles
  SET plan = _plan, credit_balance = credit_balance + _credits, updated_at = now()
  WHERE id = _user_id
  RETURNING credit_balance INTO _balance;

  INSERT INTO public.credit_ledger (
    user_id, transaction_type, amount, balance_after, reference_id
  ) VALUES (
    _user_id, 'subscription_allocation', _credits, _balance, _payment_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.activate_paid_plan(uuid,text,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_paid_plan(uuid,text,text,integer) TO service_role;

-- A user may edit their display profile, but billing fields must only change
-- through verified server-side flows or an authenticated staff action.
CREATE OR REPLACE FUNCTION public.protect_profile_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_staff(auth.uid()) THEN
    NEW.plan := OLD.plan;
    NEW.credit_balance := OLD.credit_balance;
    NEW.account_status := OLD.account_status;
    NEW.storage_used_bytes := OLD.storage_used_bytes;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_billing_fields ON public.profiles;
CREATE TRIGGER protect_profile_billing_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_billing_fields();
