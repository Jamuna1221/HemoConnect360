-- Migration: add donors.user_id referencing auth.users(id)
--
-- Run this in the Supabase SQL Editor once. It is idempotent (safe to run
-- again).
--
-- Why:
--   * The frontend stores auth.users.id as the owner of each donor profile and
--     looks the profile up by user_id at login (never by email).
--   * donors.id was already the auth user UUID, so we backfill user_id from id
--     so existing donor rows keep working.
--   * RLS policies are re-keyed to user_id (auth.uid() = user_id).

alter table public.donors
  add column if not exists user_id uuid;

-- Backfill ONLY rows whose id is a real auth user. Legacy databases may
-- contain seed/sample donor rows whose id is NOT in auth.users; setting
-- user_id = id for those would violate the FK below.
update public.donors d
  set user_id = d.id
  where d.user_id is null
    and exists (select 1 from auth.users u where u.id = d.id);

-- user_id intentionally remains nullable: legacy seed rows have no matching
-- auth user, and the FK allows NULL values. New app inserts always set it.
alter table public.donors
  drop constraint if exists donors_user_id_fkey;

alter table public.donors
  add constraint donors_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

create unique index if not exists donors_user_id_unique
  on public.donors (user_id);

-- RLS now keys on user_id ----------------------------------------------------
drop policy if exists "donors_insert_own" on public.donors;
create policy "donors_insert_own" on public.donors
  for insert with check (auth.uid() = user_id);

drop policy if exists "donors_select_own" on public.donors;
create policy "donors_select_own" on public.donors
  for select using (auth.uid() = user_id);

drop policy if exists "donors_update_own" on public.donors;
create policy "donors_update_own" on public.donors
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
