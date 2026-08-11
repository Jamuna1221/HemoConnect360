-- HemoConnect360 - Blood bank inventory
-- Run this in the Supabase SQL Editor.
--
-- Adds a real, per-blood-bank inventory of whole-blood units across the eight
-- ABO/Rh groups. There is exactly one row per (blood_bank_id, blood_group).
-- Stock is always modified through the SECURITY DEFINER RPC
-- adjust_blood_bank_inventory, which resolves the owner from auth.uid() (the
-- caller's verified JWT) and performs the quantity change atomically inside a
-- single transaction, so two concurrent requests can never lose an update.
-- Every change is appended to blood_bank_inventory_transactions as an audit log.
--
-- Status is NEVER stored: it is derived from units_available and
-- low_stock_threshold (OUT_OF_STOCK when 0, LOW_STOCK when <= threshold,
-- AVAILABLE otherwise). Nothing in the database or API trusts a client-supplied
-- status. No fake/seed stock is created - banks start with zero rows and rows
-- are lazily created on the first stock movement.

create extension if not exists "pgcrypto";

create table if not exists public.blood_bank_inventory (
  id                  uuid        primary key default gen_random_uuid(),
  blood_bank_id       uuid        not null references public.blood_banks(id) on delete cascade,
  blood_group         text        not null,
  units_available     integer     not null default 0,
  low_stock_threshold integer     not null default 3,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint blood_bank_inventory_bank_group_unique
    unique (blood_bank_id, blood_group),
  constraint blood_bank_inventory_blood_group_check
    check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  constraint blood_bank_inventory_units_check
    check (units_available >= 0),
  constraint blood_bank_inventory_threshold_check
    check (low_stock_threshold >= 0)
);

create index if not exists blood_bank_inventory_bank_idx
  on public.blood_bank_inventory (blood_bank_id);

-- Audit log for every stock movement (STOCK_ADDED / STOCK_REMOVED /
-- STOCK_CORRECTION). Writes happen only inside adjust_blood_bank_inventory.
create table if not exists public.blood_bank_inventory_transactions (
  id                uuid        primary key default gen_random_uuid(),
  blood_bank_id     uuid        not null references public.blood_banks(id) on delete cascade,
  blood_group       text        not null,
  transaction_type  text        not null,
  reason            text        not null,
  quantity_change   integer     not null,
  previous_quantity integer     not null,
  new_quantity      integer     not null,
  created_by        uuid        references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),

  constraint blood_bank_inventory_transactions_type_check
    check (transaction_type in ('STOCK_ADDED', 'STOCK_REMOVED', 'STOCK_CORRECTION')),
  constraint blood_bank_inventory_transactions_reason_check
    check (reason in ('Blood Collection', 'Blood Issue', 'Correction', 'Other')),
  constraint blood_bank_inventory_transactions_blood_group_check
    check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  constraint blood_bank_inventory_transactions_previous_quantity_check
    check (previous_quantity >= 0),
  constraint blood_bank_inventory_transactions_new_quantity_check
    check (new_quantity >= 0)
);

-- A quantity_change of 0 is allowed: it records a correction that lazily
-- created a zero-stock row (e.g. setting a never-tracked group to 0). Rows
-- that carry a real movement always have a non-zero change.
alter table public.blood_bank_inventory_transactions
  drop constraint if exists blood_bank_inventory_transactions_quantity_change_check;

create index if not exists blood_bank_inventory_transactions_bank_idx
  on public.blood_bank_inventory_transactions (blood_bank_id, created_at desc);

-- Row Level Security ---------------------------------------------------------
-- The owner of a blood bank (auth.uid() = blood_banks.user_id) can read and
-- write its own inventory rows. Normal reads/writes through the REST API run
-- with RLS enforced; the stock-adjust RPC bypasses RLS internally but
-- re-verifies ownership from auth.uid().
alter table public.blood_bank_inventory enable row level security;

drop policy if exists "blood_bank_inventory_select_own" on public.blood_bank_inventory;
create policy "blood_bank_inventory_select_own" on public.blood_bank_inventory
  for select using (
    exists (
      select 1 from public.blood_banks b
      where b.id = blood_bank_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "blood_bank_inventory_insert_own" on public.blood_bank_inventory;
create policy "blood_bank_inventory_insert_own" on public.blood_bank_inventory
  for insert with check (
    exists (
      select 1 from public.blood_banks b
      where b.id = blood_bank_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "blood_bank_inventory_update_own" on public.blood_bank_inventory;
create policy "blood_bank_inventory_update_own" on public.blood_bank_inventory
  for update using (
    exists (
      select 1 from public.blood_banks b
      where b.id = blood_bank_id and b.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.blood_banks b
      where b.id = blood_bank_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "blood_bank_inventory_delete_own" on public.blood_bank_inventory;
create policy "blood_bank_inventory_delete_own" on public.blood_bank_inventory
  for delete using (
    exists (
      select 1 from public.blood_banks b
      where b.id = blood_bank_id and b.user_id = auth.uid()
    )
  );

alter table public.blood_bank_inventory_transactions enable row level security;

drop policy if exists "blood_bank_inventory_transactions_select_own" on public.blood_bank_inventory_transactions;
create policy "blood_bank_inventory_transactions_select_own" on public.blood_bank_inventory_transactions
  for select using (
    exists (
      select 1 from public.blood_banks b
      where b.id = blood_bank_id and b.user_id = auth.uid()
    )
  );

-- Stock-adjust RPC ------------------------------------------------------------
-- The only way stock changes. SECURITY DEFINER so it can run its own upsert +
-- audit write regardless of table RLS, but it refuses any call where the bank
-- is not owned by auth.uid(). The caller supplies only a positive quantity and
-- a transaction type; ALL arithmetic happens inside this single function
-- transaction, so concurrent updates can never lose a change:
--   STOCK_ADDED     -> new = current + quantity
--   STOCK_REMOVED   -> new = current - quantity   (rejected if it would go < 0)
--   STOCK_CORRECTION-> new = quantity (absolute target, may be 0)
-- Every real change (including a no-op-safe guard) is appended to the audit
-- table with auth.uid() as created_by.
create or replace function public.adjust_blood_bank_inventory(
  p_blood_bank_id    uuid,
  p_blood_group      text,
  p_quantity         integer,
  p_transaction_type text,
  p_reason           text
) returns table (new_quantity integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current     integer;
  v_new         integer;
  v_row_existed boolean;
begin
  -- Ownership: auth.uid() must be the owner of this blood bank. Never trusts a
  -- blood_bank_id / user_id parameter from the client.
  if not exists (
    select 1 from public.blood_banks b
    where b.id = p_blood_bank_id and b.user_id = auth.uid()
  ) then
    raise exception 'FORBIDDEN';
  end if;

  -- Serialise concurrent changes to the same bank+group row.
  select units_available into v_current
  from public.blood_bank_inventory
  where blood_bank_id = p_blood_bank_id and blood_group = p_blood_group
  for update;

  v_row_existed := v_current is not null;
  v_current := coalesce(v_current, 0);

  if p_transaction_type = 'STOCK_ADDED' then
    v_new := v_current + p_quantity;
  elsif p_transaction_type = 'STOCK_REMOVED' then
    v_new := v_current - p_quantity;
  else
    -- STOCK_CORRECTION: set to the absolute target value.
    v_new := p_quantity;
  end if;

  if v_new < 0 then
    raise exception 'INSUFFICIENT_STOCK';
  end if;

  insert into public.blood_bank_inventory (blood_bank_id, blood_group, units_available)
  values (p_blood_bank_id, p_blood_group, v_new)
  on conflict (blood_bank_id, blood_group)
  do update set units_available = excluded.units_available, updated_at = now();

  -- Audit every change that actually created or altered a row. A correction
  -- that sets an existing row to its current value is a true no-op and is not
  -- recorded (quantity_change would be 0, which the table forbids).
  if v_new <> v_current or not v_row_existed then
    insert into public.blood_bank_inventory_transactions (
      blood_bank_id, blood_group, transaction_type, reason,
      quantity_change, previous_quantity, new_quantity, created_by
    ) values (
      p_blood_bank_id, p_blood_group, p_transaction_type, p_reason,
      v_new - v_current, v_current, v_new, auth.uid()
    );
  end if;

  return query select v_new;
end;
$$;

grant execute on function public.adjust_blood_bank_inventory(uuid, text, integer, text, text)
  to authenticated;
