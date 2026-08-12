-- ads_metrics: una fila por fecha + canal + dimension (campaña/evento/consulta).
-- dimension = nombre de campaña (meta/google_ads), nombre de evento (ga4),
-- consulta de búsqueda (search_console), o 'account' como fallback.
create table public.ads_metrics (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  canal text not null check (canal in ('meta','google_ads','ga4','search_console')),
  dimension text not null default 'account',
  gasto numeric(12,2),
  impresiones integer,
  clics integer,
  ctr numeric(6,4),
  cpc numeric(10,2),
  conversiones integer,
  cpl numeric(10,2),
  sesiones integer,
  posicion numeric(6,2),
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (fecha, canal, dimension)
);
alter table public.ads_metrics enable row level security;
create policy "ads_metrics_admin_all" on public.ads_metrics for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create index ads_metrics_fecha_idx on public.ads_metrics(fecha);
create index ads_metrics_canal_idx on public.ads_metrics(canal);

-- ads_recommendations: una fila por hallazgo/recomendación que genera el agente
-- de Ads a lo largo de las conversaciones, para que Ruben las vea y las marque
-- resueltas desde el panel en vez de que vivan solo en el chat.
create table public.ads_recommendations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  summary text not null,
  category text not null check (category in ('budget','creative','targeting','tracking','other')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  suggested_action text,
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','applied','dismissed')),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id)
);
alter table public.ads_recommendations enable row level security;
create policy "ads_recommendations_admin_all" on public.ads_recommendations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create index ads_recommendations_status_idx on public.ads_recommendations(status);
