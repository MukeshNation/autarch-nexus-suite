insert into public.admin_allowlist (email) values ('mukesh10august2002@gmail.com') on conflict (email) do nothing;

-- If the owner account already exists, grant the admin role now.
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
where lower(u.email) = 'mukesh10august2002@gmail.com'
on conflict (user_id, role) do nothing;