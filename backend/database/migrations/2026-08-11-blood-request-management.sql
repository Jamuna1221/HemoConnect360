-- HemoConnect360 - Blood request management (blood bank side)
-- Run this in the Supabase SQL Editor.
--
-- Lets a verified blood bank manage open blood_requests that requesters have
-- submitted through the existing requester flow (table public.blood_requests is
-- REUSED - nothing is renamed or recreated).
--
-- The single status column gains three bank-managed states on top of the
-- existing requester lifecycle:
--   submitted -> approved  (bank accepted; stock is deducted atomically)
--             -> rejected  (bank declined; reason is saved)
--   approved  -> completed (bank marked the order delivered)
-- The donor-matching statuses (notified / searching_donors / accepted) and the
-- requester terminal states (cancelled / fulfilled) are untouched.
--
-- Stock is NEVER reduced via the client. Accepting a request runs through the
-- SECURITY DEFINER RPC blood_bank_accept_request, which inside one transaction:
--   1. resolves the bank from auth.uid() (never trusts a blood_bank_id body),
--   2. locks the blood_request row and rejects double-accept / stale states,
--   3. locks the blood_bank_inventory row and refuses if units are insufficient,
--   4. deducts the units, writes the inventory audit row,
--   5. updates status -> approved and appends a blood_request_bank_actions row.
-- Reject and complete go through their own RPCs with the same ownership checks.
-- Every decision is persisted to blood_request_bank_actions as an audit trail.

------------------------------------------------------------------------------
-- 1. Decision columns on the reused blood_requests table
------------------------------------------------------------------------------
alter table public.blood_requests
  add column if not exists accepted_by_blood_bank_id uuid
    references public.blood_banks(id) on delete set null,
  add column if not exists rejected_by_blood_bank_id uuid
    references public.blood_banks(id) on delete set null,
  add column if not exists rejection_reason text,
  add column if not exists accepted_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists completed_at timestamptz;

create index if not exists blood_requests_accepted_by_bank_idx
  on public.blood_requests (accepted_by_blood_bank_id);

create index if not exists blood_requests_status_created_at_idx
  on public.blood_requests (status, created_at desc);

------------------------------------------------------------------------------
-- 2. Audit trail of every bank decision
------------------------------------------------------------------------------
create table if not exists public.blood_request_bank_actions (
  id               uuid        primary key default gen_random_uuid(),
  blood_request_id uuid        not null references public.blood_requests(id) on delete cascade,
  blood_bank_id    uuid        not null references public.blood_banks(id) on delete cascade,
  action           text        not null,
  units            integer,
  reason           text,
  created_by       uuid        references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),

  constraint blood_request_bank_actions_action_check
    check (action in ('ACCEPTED', 'REJECTED', 'COMPLETED'))
);

create index if not exists blood_request_bank_actions_request_idx
  on public.blood_request_bank_actions (blood_request_id, created_at desc);

create index if not exists blood_request_bank_actions_bank_idx
  on public.blood_request_bank_actions (blood_bank_id, created_at desc);

-- Writes happen only inside the SECURITY DEFINER RPCs below. A bank can read
-- back the actions it performed; requesters see the outcome through the
-- backend service-role client (which bypasses RLS), never through this table.
alter table public.blood_request_bank_actions enable row level security;

drop policy if exists "blood_request_bank_actions_select_own" on public.blood_request_bank_actions;
create policy "blood_request_bank_actions_select_own" on public.blood_request_bank_actions
  for select using (
    exists (
      select 1 from public.blood_banks b
      where b.id = blood_bank_id and b.user_id = auth.uid()
    )
  );

------------------------------------------------------------------------------
-- 3. Aggregate stats for the dashboard (server-computed, real counts)
------------------------------------------------------------------------------
create or replace function public.blood_requests_stats()
returns table (status text, count bigint)
language sql
security definer
set search_path = public
as $$
  select status, count(*)::bigint
  from public.blood_requests
  group by status
  order by status;
$$;

------------------------------------------------------------------------------
-- 4. Accept RPC - atomic status change + inventory deduction
-------------------------------------------------------------------------------
-- DROP first: the earlier revision of this migration shipped a version whose
-- OUT parameter was named "status"; CREATE OR REPLACE cannot change a function's
-- return type, so the old definition must be dropped before re-creating it.
drop function if exists public.blood_bank_accept_request(uuid);

create or replace function public.blood_bank_accept_request(
  p_request_id uuid
) returns table (request_id uuid, new_status text, units_deducted integer, remaining_units integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bank_id    uuid;
  v_group      text;
  v_units      integer;
  v_req_status text;
  v_current    integer;
  v_new        integer;
begin
  -- Ownership: auth.uid() must own a blood bank. Never trusts a client id.
  select b.id into v_bank_id
  from public.blood_banks b
  where b.user_id = auth.uid()
  limit 1;

  if v_bank_id is null then
    raise exception 'FORBIDDEN';
  end if;

  -- Lock the request row so a second accept (same or other bank) fails safely.
  select br.status, br.blood_group, br.units_required
    into v_req_status, v_group, v_units
  from public.blood_requests br
  where br.id = p_request_id
  for update;

  if v_req_status is null then
    raise exception 'REQUEST_NOT_FOUND';
  end if;

  if v_req_status not in ('submitted', 'notified', 'searching_donors', 'accepted') then
    raise exception 'REQUEST_NOT_OPEN';
  end if;

  -- Lock the inventory row and deduct atomically. A missing row is 0 stock.
  select inv.units_available into v_current
  from public.blood_bank_inventory inv
  where inv.blood_bank_id = v_bank_id and inv.blood_group = v_group
  for update;

  v_current := coalesce(v_current, 0);

  if v_current < v_units then
    raise exception 'INSUFFICIENT_STOCK';
  end if;

  v_new := v_current - v_units;

  insert into public.blood_bank_inventory (blood_bank_id, blood_group, units_available)
  values (v_bank_id, v_group, v_new)
  on conflict (blood_bank_id, blood_group)
  do update set units_available = excluded.units_available, updated_at = now();

  insert into public.blood_bank_inventory_transactions (
    blood_bank_id, blood_group, transaction_type, reason,
    quantity_change, previous_quantity, new_quantity, created_by
  ) values (
    v_bank_id, v_group, 'STOCK_REMOVED', 'Blood Issue',
    -v_units, v_current, v_new, auth.uid()
  );

  update public.blood_requests
  set status = 'approved',
      accepted_by_blood_bank_id = v_bank_id,
      accepted_at = now(),
      updated_at = now()
  where id = p_request_id;

  insert into public.blood_request_bank_actions (
    blood_request_id, blood_bank_id, action, units, reason, created_by
  ) values (
    p_request_id, v_bank_id, 'ACCEPTED', v_units, 'Blood Issue', auth.uid()
  );

  return query select p_request_id, 'approved', v_units, v_new;
end;
$$;

------------------------------------------------------------------------------
-- 5. Reject RPC - status + saved reason, no inventory change
-------------------------------------------------------------------------------
drop function if exists public.blood_bank_reject_request(uuid, text);

create or replace function public.blood_bank_reject_request(
  p_request_id uuid,
  p_reason     text
) returns table (request_id uuid, new_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bank_id    uuid;
  v_req_status text;
begin
  select b.id into v_bank_id
  from public.blood_banks b
  where b.user_id = auth.uid()
  limit 1;

  if v_bank_id is null then
    raise exception 'FORBIDDEN';
  end if;

  select br.status into v_req_status
  from public.blood_requests br
  where br.id = p_request_id
  for update;

  if v_req_status is null then
    raise exception 'REQUEST_NOT_FOUND';
  end if;

  if v_req_status not in ('submitted', 'notified', 'searching_donors', 'accepted') then
    raise exception 'REQUEST_NOT_OPEN';
  end if;

  update public.blood_requests
  set status = 'rejected',
      rejected_by_blood_bank_id = v_bank_id,
      rejection_reason = nullif(trim(p_reason), ''),
      rejected_at = now(),
      updated_at = now()
  where id = p_request_id;

  insert into public.blood_request_bank_actions (
    blood_request_id, blood_bank_id, action, reason, created_by
  ) values (
    p_request_id, v_bank_id, 'REJECTED', nullif(trim(p_reason), ''), auth.uid()
  );

  return query select p_request_id, 'rejected';
end;
$$;

------------------------------------------------------------------------------
-- 6. Complete RPC - only the bank that accepted can complete
-------------------------------------------------------------------------------
drop function if exists public.blood_bank_complete_request(uuid);

create or replace function public.blood_bank_complete_request(
  p_request_id uuid
) returns table (request_id uuid, new_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bank_id    uuid;
  v_req_status text;
  v_req_bank   uuid;
begin
  select b.id into v_bank_id
  from public.blood_banks b
  where b.user_id = auth.uid()
  limit 1;

  if v_bank_id is null then
    raise exception 'FORBIDDEN';
  end if;

  select br.status, br.accepted_by_blood_bank_id
    into v_req_status, v_req_bank
  from public.blood_requests br
  where br.id = p_request_id
  for update;

  if v_req_status is null then
    raise exception 'REQUEST_NOT_FOUND';
  end if;

  if v_req_status <> 'approved' then
    raise exception 'REQUEST_NOT_OPEN';
  end if;

  if v_req_bank is distinct from v_bank_id then
    raise exception 'FORBIDDEN';
  end if;

  update public.blood_requests
  set status = 'completed',
      completed_at = now(),
      updated_at = now()
  where id = p_request_id;

  insert into public.blood_request_bank_actions (
    blood_request_id, blood_bank_id, action, created_by
  ) values (
    p_request_id, v_bank_id, 'COMPLETED', auth.uid()
  );

  return query select p_request_id, 'completed';
end;
$$;

grant execute on function public.blood_requests_stats() to authenticated;
grant execute on function public.blood_bank_accept_request(uuid) to authenticated;
grant execute on function public.blood_bank_reject_request(uuid, text) to authenticated;
grant execute on function public.blood_bank_complete_request(uuid) to authenticated;
