-- Addresses two Supabase security-advisor findings surfaced right after
-- 0010: mutable search_path on the new role-check functions (and the
-- pre-existing set_updated_at, flagged for the same reason), and
-- handle_new_user being callable directly via the PostgREST RPC API even
-- though it's only ever meant to run as an auth.users trigger.

create or replace function public.current_role()
returns public.user_role
language sql stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active;
$$;

create or replace function public.is_admin()
returns boolean
language sql stable
set search_path = public
as $$
  select public.current_role() = 'admin';
$$;

create or replace function public.is_active_user()
returns boolean
language sql stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
