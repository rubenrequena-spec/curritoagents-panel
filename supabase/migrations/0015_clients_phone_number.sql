-- The Retell/Zadarma phone number assigned to this client (e.g.
-- +34919933279), separate from lead.telefono (the client's own contact
-- number). Needed to find a client by their assigned line once there are
-- many clients. Nullable: set manually when the number is provisioned.
alter table public.clients
  add column phone_number text;
