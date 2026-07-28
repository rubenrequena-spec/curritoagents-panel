-- current_role()/is_admin()/is_active_user() became SECURITY DEFINER in
-- 0012 to fix a recursion bug, which the security advisor then flagged as
-- callable directly via the public REST RPC API. They're harmless to call
-- (auth.uid() is hardcoded internally, so a caller only ever learns their
-- own role) but there's no reason to expose them outside RLS policy
-- evaluation. `authenticated` keeps EXECUTE since policies invoke these as
-- the logged-in user; anon/public do not need it (auth.uid() is null for
-- anon anyway).
revoke execute on function public.current_role() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_active_user() from public, anon;
