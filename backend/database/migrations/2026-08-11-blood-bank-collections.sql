-- HemoConnect360 - Blood Bank Donor / Collection Records
-- Run this in the Supabase SQL Editor.
--
-- Reuses the existing public.donations table as the single source of truth for
-- blood collections. Adds blood_bank_id so a real collection is associated with
-- the blood bank that collected it (the authenticated owner is never supplied
-- by the client; it is resolved from auth.uid() inside the RPCs).
--
-- Banks cannot read donors directly (public.donors RLS only allows a donor to
-- see their own row), so every bank-facing read/write goes through SECURITY
-- DEFINER RPCs that first verify auth.uid() owns a blood bank - the same
-- pattern used by match_nearby_donors / blood_bank_accept_request.
--
-- The record RPC reuses the existing eligibility rule (donor_interval_days:
-- male 90, otherwise 120), the existing last_donation sync trigger on
-- donations, and the existing inventory RPC adjust_blood_bank_inventory so a
-- collection both writes the donation row AND adds stock in one transaction.

------------------------------------------------------------------------------
-- 1. Link donations to the owning blood bank
------------------------------------------------------------------------------
alter table public.donations
  add column if not exists blood_bank_id uuid
    references public.blood_banks(id) on delete set null;

create index if not exists donations_blood_bank_id_idx
  on public.donations (blood_bank_id);

-- A bank may record a collection for the same donor + bank + date only once.
-- Donor-entered rows (blood_bank_id NULL) are unaffected because NULLs are
-- treated as distinct by unique constraints.
alter table public.donations
  drop constraint if exists donations_bank_donor_date_unique;
alter table public.donations
  add constraint donations_bank_donor_date_unique
    unique (donor_id, blood_bank_id, donation_date);

-- RLS: donors keep their own-row policies (insert/select/update/delete).
-- Banks may READ donation rows linked to their own bank; every write goes
-- through the SECURITY DEFINER RPC below.
alter table public.donations enable row level security;

drop policy if exists "blood_bank_collections_select_own" on public.donations;
create policy "blood_bank_collections_select_own" on public.donations
  for select using (
    exists (
      select 1 from public.blood_banks b
      where b.id = blood_bank_id and b.user_id = auth.uid()
    )
  );

------------------------------------------------------------------------------
-- 2. Available donors for the authenticated blood bank
------------------------------------------------------------------------------
-- Returns active donors with their registered details and a computed
-- eligibility flag (reusing donor_interval_days). Eligibility is derived, never
-- stored, exactly like inventory status.
create or replace function public.blood_bank_available_donors()
returns table (
  donor_id       uuid,
  full_name      text,
  phone          text,
  blood_group    text,
  city           text,
  gender         text,
  dob            date,
  weight         numeric,
  hemoglobin     numeric,
  last_donation  date,
  eligible       boolean,
  next_eligible  date
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.blood_banks b where b.user_id = auth.uid()
  ) then
    raise exception 'FORBIDDEN';
  end if;

  return query
    select
      d.id,
      d.full_name,
      d.phone,
      d.blood_group,
      d.city,
      d.gender,
      d.dob,
      d.weight,
      d.hemoglobin,
      d.last_donation,
      (
        d.status = 'active'
        and (
          d.last_donation is null
          or (current_date - d.last_donation) >= public.donor_interval_days(d.gender)
        )
      ) as eligible,
      case
        when d.status = 'active' and d.last_donation is not null
          then d.last_donation + public.donor_interval_days(d.gender)
        else null
      end as next_eligible
    from public.donors d
    where d.status = 'active'
      and d.blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    order by d.full_name asc;
end;
$$;

grant execute on function public.blood_bank_available_donors() to authenticated;

------------------------------------------------------------------------------
-- 3. Donor details by phone (bank owner only)
------------------------------------------------------------------------------
-- Lets the bank validate a donor before recording a collection: returns the
-- donor plus the same derived eligibility flag / next-eligible date.
create or replace function public.blood_bank_find_donor(p_phone text)
returns table (
  donor_id       uuid,
  full_name      text,
  phone          text,
  blood_group    text,
  city           text,
  gender         text,
  dob            date,
  weight         numeric,
  hemoglobin     numeric,
  last_donation  date,
  eligible       boolean,
  next_eligible  date
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.blood_banks b where b.user_id = auth.uid()
  ) then
    raise exception 'FORBIDDEN';
  end if;

  return query
    select
      d.id,
      d.full_name,
      d.phone,
      d.blood_group,
      d.city,
      d.gender,
      d.dob,
      d.weight,
      d.hemoglobin,
      d.last_donation,
      (
        d.status = 'active'
        and (
          d.last_donation is null
          or (current_date - d.last_donation) >= public.donor_interval_days(d.gender)
        )
      ) as eligible,
      case
        when d.status = 'active' and d.last_donation is not null
          then d.last_donation + public.donor_interval_days(d.gender)
        else null
      end as next_eligible
    from public.donors d
    where d.phone = trim(p_phone)
    limit 1;
end;
$$;

grant execute on function public.blood_bank_find_donor(text) to authenticated;

------------------------------------------------------------------------------
-- 4. Collection history for the authenticated blood bank
------------------------------------------------------------------------------
-- Only rows where blood_bank_id = the caller's own bank, joined to donors for
-- the name / phone / blood group the bank needs on screen.
create or replace function public.blood_bank_collection_history()
returns table (
  id            uuid,
  donor_id      uuid,
  donor_name    text,
  donor_phone   text,
  blood_group   text,
  donation_date date,
  units         integer,
  city          text,
  notes         text,
  created_at    timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bank_id uuid;
begin
  select b.id into v_bank_id
  from public.blood_banks b
  where b.user_id = auth.uid()
  limit 1;

  if v_bank_id is null then
    raise exception 'FORBIDDEN';
  end if;

  return query
    select
      d.id,
      d.donor_id,
      dn.full_name,
      dn.phone,
      dn.blood_group,
      d.donation_date,
      d.units,
      d.city,
      d.notes,
      d.created_at
    from public.donations d
    join public.donors dn on dn.id = d.donor_id
    where d.blood_bank_id = v_bank_id
    order by d.donation_date desc, d.created_at desc;
end;
$$;

grant execute on function public.blood_bank_collection_history() to authenticated;

------------------------------------------------------------------------------
-- 5. Record a real blood collection (donation + inventory add, atomic)
------------------------------------------------------------------------------
-- The only way a bank records a collection. Runs entirely inside one function
-- (one transaction):
--   1. resolves the bank from auth.uid() - never trusts a client blood_bank_id,
--   2. validates the donor (exists + active), the blood group (valid + matches
--      the donor's registered group), the units (1-5), the date (not future),
--   3. validates eligibility with the existing donor_interval_days rule,
--   4. rejects duplicate collections (same donor + bank + date),
--   5. inserts the real donation row (the existing trigger keeps
--      donors.last_donation in sync, which drives matching + eligibility),
--   6. calls the existing adjust_blood_bank_inventory RPC with
--      'Blood Collection' so the inventory audit trail is written too.
-- Because the inventory add happens in the same transaction, if either step
-- fails everything rolls back - collection and stock can never diverge.
create or replace function public.blood_bank_record_collection(
  p_donor_phone   text,
  p_blood_group   text,
  p_donation_date date,
  p_units         integer,
  p_notes         text
)
returns table (
  donation_id            uuid,
  donor_id               uuid,
  donor_name             text,
  blood_group            text,
  donation_date          date,
  units                  integer,
  blood_bank_id          uuid,
  new_inventory_quantity integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bank_id          uuid;
  v_bank_name        text;
  v_city             text;
  v_donor_id         uuid;
  v_donor_name       text;
  v_registered_group text;
  v_gender           text;
  v_last_donation    date;
  v_interval         integer;
  v_blood_group      text := upper(coalesce(nullif(trim(p_blood_group), ''), ''));
  v_units            integer;
  v_date             date := coalesce(p_donation_date, current_date);
  v_donation_id      uuid;
  v_new_qty          integer;
begin
  -- Ownership: the caller must own a blood bank.
  select b.id, b.blood_bank_name, b.city
    into v_bank_id, v_bank_name, v_city
  from public.blood_banks b
  where b.user_id = auth.uid()
  limit 1;

  if v_bank_id is null then
    raise exception 'FORBIDDEN';
  end if;

  -- Donor validation: must exist and be active.
  select d.id, d.full_name, d.blood_group, d.gender, d.last_donation
    into v_donor_id, v_donor_name, v_registered_group, v_gender, v_last_donation
  from public.donors d
  where d.phone = trim(p_donor_phone)
  limit 1;

  if v_donor_id is null then
    raise exception 'DONOR_NOT_FOUND';
  end if;

  if not exists (
    select 1 from public.donors d where d.id = v_donor_id and d.status = 'active'
  ) then
    raise exception 'DONOR_INACTIVE';
  end if;

  -- Blood group validation: valid group and must match the registered group.
  if v_blood_group not in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') then
    raise exception 'INVALID_BLOOD_GROUP';
  end if;

  if v_blood_group <> v_registered_group then
    raise exception 'BLOOD_GROUP_MISMATCH';
  end if;

  -- Units validation: whole units within the collection limit.
  if p_units is null or p_units < 1 or p_units > 5 then
    raise exception 'INVALID_UNITS';
  end if;
  v_units := p_units;

  -- Date validation: never record a future collection.
  if v_date > current_date then
    raise exception 'FUTURE_DATE';
  end if;

  -- Eligibility: reuse the existing donor_interval_days rule.
  v_interval := public.donor_interval_days(v_gender);
  if v_last_donation is not null
     and (v_date - v_last_donation) < v_interval then
    raise exception 'NOT_ELIGIBLE';
  end if;

  -- Duplicate collection: same donor + same bank + same date. The row lock
  -- serialises concurrent attempts; the unique constraint below is the final
  -- guard for the race where no row existed yet.
  -- Note: donor_id / blood_bank_id / donation_date must be table-qualified -
  -- they are also RETURNS TABLE output names, so unqualified references would
  -- be ambiguous in PL/pgSQL.
  perform 1 from public.donations d
  where d.donor_id = v_donor_id
    and d.blood_bank_id = v_bank_id
    and d.donation_date = v_date
  for update;

  if found then
    raise exception 'DUPLICATE_COLLECTION';
  end if;

  begin
    insert into public.donations (
      donor_id, donation_date, blood_bank, city, units, notes, blood_bank_id
    ) values (
      v_donor_id, v_date, v_bank_name, v_city, v_units,
      nullif(trim(p_notes), ''), v_bank_id
    )
    returning id into v_donation_id;
  exception
    when unique_violation then
      raise exception 'DUPLICATE_COLLECTION';
  end;

  -- Update the existing blood inventory using the existing inventory RPC.
  -- Same transaction: any failure here rolls back the donation insert above.
  select new_quantity into v_new_qty
  from public.adjust_blood_bank_inventory(
    v_bank_id, v_blood_group, v_units, 'STOCK_ADDED', 'Blood Collection'
  );

  return query
    select v_donation_id, v_donor_id, v_donor_name, v_blood_group,
           v_date, v_units, v_bank_id, v_new_qty;
end;
$$;

grant execute on function public.blood_bank_record_collection(text, text, date, integer, text)
  to authenticated;
