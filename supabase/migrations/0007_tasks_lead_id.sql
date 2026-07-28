alter table public.tasks add column lead_id uuid references public.leads(id) on delete cascade;

update public.tasks t
set lead_id = c.lead_id
from public.clients c
where t.client_id = c.id;

alter table public.tasks alter column lead_id set not null;

drop index if exists tasks_client_id_idx;
alter table public.tasks drop column client_id;

create index tasks_lead_id_idx on public.tasks(lead_id);
