create type public.client_status as enum ('activo', 'baja');

alter table public.clients
  add column status public.client_status not null default 'activo',
  add column baja_at timestamptz;
