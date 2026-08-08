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

update public.donors
  set user_id = id
  where user_id is null;

alter table public.donors
  alter column user_id set not null;

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
