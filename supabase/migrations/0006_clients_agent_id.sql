-- Links a client to its n8n voice-agent id, so the client detail page can
-- fetch real per-call minute usage via lib/n8n.ts (a dedicated webhook, not
-- the account-wide Data Table REST API). Nullable, no FK: this is an
-- external n8n identifier, not a local reference. A single column rather
-- than a join table -- simple-for-now was the explicit product decision;
-- Maestro's 5-number case is out of scope for this phase.
alter table public.clients
  add column agent_id text;

-- Partial + unique: guards against copy/paste errors that would silently
-- point two clients at the same agent (each client's usage would then
-- double-count).
create unique index clients_agent_id_idx on public.clients (agent_id) where agent_id is not null;
