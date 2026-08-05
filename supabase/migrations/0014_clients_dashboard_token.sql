-- Mirrors the dashboard_token n8n generates for this client's row in the
-- clientes_config Data Table (provisioned by setClientAgentId via the
-- "CurritoAgents — Aprovisionar Panel Cliente (API)" n8n workflow), so the
-- client detail page can display the public panel link without an extra
-- round-trip to n8n on every page load. Nullable: stays empty until an
-- agent_id has been linked and n8n has answered.
alter table public.clients
  add column dashboard_token text;

-- Same rationale as clients_agent_id_idx (0006): guards against two clients
-- ending up with the same token, which would let one client see another's
-- panel.
create unique index clients_dashboard_token_idx on public.clients (dashboard_token) where dashboard_token is not null;
