CREATE OR REPLACE FUNCTION public.spend_credits(_amount integer, _reference text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  UPDATE public.profiles
     SET credit_balance = credit_balance - _amount,
         updated_at = now()
   WHERE id = _uid
     AND credit_balance >= _amount
  RETURNING credit_balance INTO _new;

  IF _new IS NULL THEN
    RAISE EXCEPTION 'insufficient credits';
  END IF;

  INSERT INTO public.credit_ledger (user_id, transaction_type, amount, balance_after, reference_id)
  VALUES (_uid, 'reservation', -_amount, _new, _reference);

  RETURN _new;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_credits(_amount integer, _reference text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _new integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
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

REVOKE ALL ON FUNCTION public.spend_credits(integer, text) FROM public;
REVOKE ALL ON FUNCTION public.refund_credits(integer, text) FROM public;
GRANT EXECUTE ON FUNCTION public.spend_credits(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credits(integer, text) TO authenticated;