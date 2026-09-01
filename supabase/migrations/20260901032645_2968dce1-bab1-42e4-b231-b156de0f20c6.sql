REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.is_workspace_member(uuid, uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;

-- RLS policies on these tables run as the invoking role, so signed-in users must keep EXECUTE.
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;