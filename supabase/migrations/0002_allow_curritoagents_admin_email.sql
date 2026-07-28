-- The panel login was actually being used with ruben.requena@curritoagents.com,
-- but the original RLS policies only allowed ruben.requena@avocoding.com — so
-- every read/write silently returned zero rows for that session (no error).
drop policy "admin_full_access_leads" on public.leads;
create policy "admin_full_access_leads"
  on public.leads
  for all
  to authenticated
  using (auth.email() in ('ruben.requena@avocoding.com', 'ruben.requena@curritoagents.com'))
  with check (auth.email() in ('ruben.requena@avocoding.com', 'ruben.requena@curritoagents.com'));

drop policy "admin_full_access_lead_notes" on public.lead_notes;
create policy "admin_full_access_lead_notes"
  on public.lead_notes
  for all
  to authenticated
  using (auth.email() in ('ruben.requena@avocoding.com', 'ruben.requena@curritoagents.com'))
  with check (auth.email() in ('ruben.requena@avocoding.com', 'ruben.requena@curritoagents.com'));
