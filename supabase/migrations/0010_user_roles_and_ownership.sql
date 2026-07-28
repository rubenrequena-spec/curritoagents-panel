-- Introduces two roles (admin / comercial) backed by a profiles table, plus
-- per-lead ownership so a comercial only ever sees leads/clients they
-- created or were assigned. Replaces the old hardcoded-email RLS policies
-- (0001/0004/0005/0002), which only ever supported a single admin user.

create type public.user_role as enum ('admin', 'comercial');

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  role       public.user_role not null default 'comercial',
  -- Soft-disable instead of deleting: keeps FK history (owned leads, notes,
  -- audit trail) intact when someone leaves, and instantly revokes RLS
  -- access even if their session/JWT is still technically valid.
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Existing leads/clients have no owner yet: unassigned rows are admin-only
-- until manually assigned (see leads_comercial_select_own below, which
-- requires an exact owner_id match — null never matches).
alter table public.leads add column owner_id uuid references auth.users(id);
create index leads_owner_id_idx on public.leads(owner_id);

-- STABLE, not SECURITY DEFINER: runs as the calling user, so it relies on
-- (and is bounded by) the "read own profile" policy below rather than
-- bypassing RLS altogether.
create or replace function public.current_role()
returns public.user_role
language sql stable
as $$
  select role from public.profiles where id = auth.uid() and active;
$$;

create or replace function public.is_admin()
returns boolean
language sql stable
as $$
  select public.current_role() = 'admin';
$$;

create or replace function public.is_active_user()
returns boolean
language sql stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles_admin_insert"
  on public.profiles for insert
  to authenticated
  with check (public.is_admin());

create policy "profiles_admin_update"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Auto-provisions a profile row whenever an account is created via the
-- Supabase Admin API (app/actions/users.ts sets user_metadata.role/full_name
-- at creation time; this trigger is what turns that into a profiles row).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'comercial')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: the two emails the old hardcoded RLS policies allowed become
-- admins; any other pre-existing auth user (shouldn't be any) defaults to
-- comercial rather than silently inheriting admin rights.
insert into public.profiles (id, email, role)
select
  id,
  email,
  case
    when email in ('ruben.requena@avocoding.com', 'ruben.requena@curritoagents.com') then 'admin'
    else 'comercial'
  end::public.user_role
from auth.users
on conflict (id) do nothing;

-- leads --------------------------------------------------------------
drop policy "admin_full_access_leads" on public.leads;

create policy "leads_admin_all"
  on public.leads for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "leads_comercial_select_own"
  on public.leads for select
  to authenticated
  using (public.is_active_user() and owner_id = auth.uid());

create policy "leads_comercial_insert_own"
  on public.leads for insert
  to authenticated
  with check (public.is_active_user() and owner_id = auth.uid());

create policy "leads_comercial_update_own"
  on public.leads for update
  to authenticated
  using (public.is_active_user() and owner_id = auth.uid())
  with check (public.is_active_user() and owner_id = auth.uid());

-- No comercial delete policy: deleting leads stays admin-only (leads_admin_all).

-- lead_notes -----------------------------------------------------------
drop policy "admin_full_access_lead_notes" on public.lead_notes;

create policy "lead_notes_admin_all"
  on public.lead_notes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "lead_notes_comercial_own_lead"
  on public.lead_notes for all
  to authenticated
  using (
    public.is_active_user()
    and exists (select 1 from public.leads l where l.id = lead_notes.lead_id and l.owner_id = auth.uid())
  )
  with check (
    public.is_active_user()
    and exists (select 1 from public.leads l where l.id = lead_notes.lead_id and l.owner_id = auth.uid())
  );

-- tasks ------------------------------------------------------------------
drop policy "admin_full_access_tasks" on public.tasks;

create policy "tasks_admin_all"
  on public.tasks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "tasks_comercial_own_lead"
  on public.tasks for all
  to authenticated
  using (
    public.is_active_user()
    and exists (select 1 from public.leads l where l.id = tasks.lead_id and l.owner_id = auth.uid())
  )
  with check (
    public.is_active_user()
    and exists (select 1 from public.leads l where l.id = tasks.lead_id and l.owner_id = auth.uid())
  );

-- clients ------------------------------------------------------------------
-- No owner_id of its own: ownership is always derived through its lead.
drop policy "admin_full_access_clients" on public.clients;

create policy "clients_admin_all"
  on public.clients for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "clients_comercial_select_own"
  on public.clients for select
  to authenticated
  using (
    public.is_active_user()
    and exists (select 1 from public.leads l where l.id = clients.lead_id and l.owner_id = auth.uid())
  );

create policy "clients_comercial_insert_own"
  on public.clients for insert
  to authenticated
  with check (
    public.is_active_user()
    and exists (select 1 from public.leads l where l.id = clients.lead_id and l.owner_id = auth.uid())
  );

create policy "clients_comercial_update_own"
  on public.clients for update
  to authenticated
  using (
    public.is_active_user()
    and exists (select 1 from public.leads l where l.id = clients.lead_id and l.owner_id = auth.uid())
  )
  with check (
    public.is_active_user()
    and exists (select 1 from public.leads l where l.id = clients.lead_id and l.owner_id = auth.uid())
  );

-- No comercial delete policy: deleting clients stays admin-only (clients_admin_all).
