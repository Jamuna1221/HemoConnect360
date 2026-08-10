-- HemoConnect360 - Donation History
-- Run this in the Supabase SQL Editor.
--
-- Adds a donations table so donors can record past donations (date, blood
-- bank, city, units). A trigger keeps donors.last_donation in sync with the
-- latest recorded donation, so the backend matching (match_nearby_donors)
-- and the donor dashboard's 90-day eligibility always use real history.
--
-- Donors interact directly with Supabase (same as registration/login), so
-- RLS policies let the donor insert/select/delete only their own donations.

create table if not exists public.donations (
  id            uuid primary key default gen_random_uuid(),
  donor_id      uuid not null references public.donors(id) on delete cascade,
  donation_date date not null default current_date,
  blood_bank    text not null,
  city          text,
  units         integer not null default 1 check (units >= 1),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists donations_donor_date_idx
  on public.donations (donor_id, donation_date desc);

-- Row Level Security ---------------------------------------------------------
alter table public.donations enable row level security;

drop policy if exists "donations_insert_own" on public.donations;
create policy "donations_insert_own" on public.donations
  for insert with check (auth.uid() = donor_id);

drop policy if exists "donations_select_own" on public.donations;
create policy "donations_select_own" on public.donations
  for select using (auth.uid() = donor_id);

drop policy if exists "donations_delete_own" on public.donations;
create policy "donations_delete_own" on public.donations
  for delete using (auth.uid() = donor_id);

drop policy if exists "donations_update_own" on public.donations;
create policy "donations_update_own" on public.donations
  for update using (auth.uid() = donor_id) with check (auth.uid() = donor_id);

-- Trigger: keep donors.last_donation = latest donation date -------------------
-- Runs as definer (postgres) so it can update any donor row regardless of RLS.
create or replace function public.sync_donor_last_donation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_donor_id uuid := coalesce(new.donor_id, old.donor_id);
begin
  if v_donor_id is not null then
    update public.donors
    set last_donation = (
      select max(s.donation_date)
      from public.donations s
      where s.donor_id = v_donor_id
    ),
    updated_at = now()
    where id = v_donor_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists donations_last_donation_sync on public.donations;
create trigger donations_last_donation_sync
  after insert or update of donation_date, donor_id or delete on public.donations
  for each row execute function public.sync_donor_last_donation();