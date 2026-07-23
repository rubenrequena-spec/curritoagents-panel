create extension if not exists pgcrypto;

create type lead_source as enum ('wizard', 'a_medida');

create type lead_status as enum (
  'nuevo',
  'contactado',
  'demo_agendada',
  'demo_hecha',
  'ganado',
  'perdido'
);

create type lead_plan as enum ('aprendiz', 'oficial', 'maestro');

create table public.leads (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  source           lead_source not null,
  status           lead_status not null default 'nuevo',

  nombre           text not null,
  negocio          text not null,
  telefono         text,
  email            text,
  contacto         text,
  descripcion      text,

  ciudad           text,
  oficio           text,
  oficio_otro      text,
  llamadas_semana  text,
  voz              text,

  plan             lead_plan,
  paid             boolean not null default false,
  paid_at          timestamptz,

  consentimiento   boolean not null default true,
  raw_payload      jsonb
);

create table public.lead_notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create index leads_status_idx on public.leads(status);
create index leads_source_idx on public.leads(source);
create index leads_created_at_idx on public.leads(created_at desc);
create index lead_notes_lead_id_idx on public.lead_notes(lead_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;

create policy "admin_full_access_leads"
  on public.leads
  for all
  to authenticated
  using (auth.email() = 'ruben.requena@avocoding.com')
  with check (auth.email() = 'ruben.requena@avocoding.com');

create policy "admin_full_access_lead_notes"
  on public.lead_notes
  for all
  to authenticated
  using (auth.email() = 'ruben.requena@avocoding.com')
  with check (auth.email() = 'ruben.requena@avocoding.com');
