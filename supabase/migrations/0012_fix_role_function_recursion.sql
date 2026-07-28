-- Fixes a real production bug: current_role()/is_admin()/is_active_user()
-- each SELECT from public.profiles, which itself carries an RLS policy that
-- calls is_admin() — for at least one account this recursed until Postgres
-- hit its stack depth limit ("stack depth limit exceeded"), breaking every
-- page for that user. Making these SECURITY DEFINER means their internal
-- SELECT runs as the function owner (bypasses profiles' RLS entirely)
-- instead of re-triggering the calling user's policy, which breaks the
-- recursion for good. Each function still only ever returns facts about the
-- caller's own row (auth.uid() is hardcoded, not caller-supplied), so this
-- doesn't expand what a caller can learn via these functions.

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'admin';
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;
