-- HemoConnect360 - Use donors.id as the Supabase Auth identity
-- Run this after confirming donors.id contains the Auth UUID for real donors.

alter table public.donors
  drop constraint if exists donors_user_id_fkey;

drop index if exists public.donors_user_id_unique;

drop policy if exists "donors_insert_own" on public.donors;
drop policy if exists "donors_select_own" on public.donors;
drop policy if exists "donors_update_own" on public.donors;

alter table public.donors
  drop column if exists user_id;

create policy "donors_insert_own" on public.donors
  for insert with check (auth.uid() = id);

create policy "donors_select_own" on public.donors
  for select using (auth.uid() = id);

create policy "donors_update_own" on public.donors
  for update using (auth.uid() = id) with check (auth.uid() = id);
