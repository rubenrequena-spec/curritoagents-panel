-- Clients: one row per lead that has ever won (status='ganado'), created
-- automatically by confirmLeadWon (app/actions/leads.ts). Minimal columns
-- only, by design: payments/tasks/minutes-tracking fields are out of scope
-- for this phase and will arrive as their own migrations once those phases
-- are actually designed (same incremental pattern as 0001 -> 0002 -> 0003).
create table public.clients (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null unique references public.leads(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Backfill: leads that were already ganado before this migration shipped.
insert into public.clients (lead_id, created_at)
select id, coalesce(closed_at, created_at)
from public.leads
where status = 'ganado'
on conflict (lead_id) do nothing;

create index clients_lead_id_idx on public.clients(lead_id);

alter table public.clients enable row level security;

create policy "admin_full_access_clients"
  on public.clients
  for all
  to authenticated
  using (auth.email() in ('ruben.requena@avocoding.com', 'ruben.requena@curritoagents.com'))
  with check (auth.email() in ('ruben.requena@avocoding.com', 'ruben.requena@curritoagents.com'));
