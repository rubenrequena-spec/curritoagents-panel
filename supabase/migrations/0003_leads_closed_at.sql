-- Dedicated timestamp for when a lead most recently entered a closed state
-- (ganado or perdido). Neither paid_at (null for perdido) nor updated_at
-- (bumped by any unrelated edit via the set_updated_at trigger) can be
-- trusted to represent "when this lead closed" — this column is maintained
-- explicitly by application code (app/actions/leads.ts), same pattern as
-- paid_at already uses.
alter table public.leads
  add column closed_at timestamptz;

-- Backfill: for leads already closed, updated_at is the best available
-- approximation of when they closed.
update public.leads
set closed_at = updated_at
where status in ('ganado', 'perdido');

create index leads_closed_at_idx on public.leads (closed_at);
