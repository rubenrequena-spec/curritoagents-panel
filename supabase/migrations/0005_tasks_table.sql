-- Per-client task list ("calendario") for llamada/demo/cierre follow-ups.
-- Flat list, not a calendar grid. Also the source of the notifications
-- bell's "upcoming/overdue" category.
create type public.task_type as enum ('llamada', 'demo', 'cierre');

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  type         task_type not null,
  scheduled_at timestamptz not null,
  notes        text,
  completed    boolean not null default false,
  created_at   timestamptz not null default now()
);

create index tasks_client_id_idx on public.tasks(client_id);
-- Serves the notifications bell's cross-client "due or overdue, not
-- completed" query.
create index tasks_scheduled_at_idx on public.tasks(scheduled_at) where not completed;

alter table public.tasks enable row level security;

create policy "admin_full_access_tasks"
  on public.tasks
  for all
  to authenticated
  using (auth.email() in ('ruben.requena@avocoding.com', 'ruben.requena@curritoagents.com'))
  with check (auth.email() in ('ruben.requena@avocoding.com', 'ruben.requena@curritoagents.com'));
