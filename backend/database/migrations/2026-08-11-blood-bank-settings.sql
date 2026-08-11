-- HemoConnect360 - Blood bank settings & notification preferences
-- Run this in the Supabase SQL Editor.
--
-- One settings row per blood bank (blood_bank_id is the primary key), owned by
-- the bank's auth user. All notification preferences default to enabled and the
-- default nearby-request radius matches the blood_bank_nearby_requests RPC
-- default (25 km). RLS keeps every row tied to auth.uid() so the bank can only
-- ever read/update its own settings - the backend resolves the identity from
-- the JWT and never trusts a blood_bank_id / user_id from the client.
--
-- Passwords are NOT stored here or anywhere in the app database: the change
-- password flow uses Supabase Auth (auth.updateUser) directly.

create table if not exists public.blood_bank_settings (
  blood_bank_id               uuid primary key references public.blood_banks(id) on delete cascade,
  user_id                     uuid not null references auth.users(id) on delete cascade,
  blood_request_notifications boolean not null default true,
  nearby_request_notifications boolean not null default true,
  inventory_notifications     boolean not null default true,
  collection_notifications    boolean not null default true,
  system_notifications        boolean not null default true,
  default_request_radius_km   integer not null default 25 check (default_request_radius_km between 1 and 500),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

alter table public.blood_bank_settings enable row level security;

drop policy if exists "blood_bank_settings_select_own" on public.blood_bank_settings;
create policy "blood_bank_settings_select_own"
  on public.blood_bank_settings
  for select
  using (auth.uid() = user_id);

drop policy if exists "blood_bank_settings_insert_own" on public.blood_bank_settings;
create policy "blood_bank_settings_insert_own"
  on public.blood_bank_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "blood_bank_settings_update_own" on public.blood_bank_settings;
create policy "blood_bank_settings_update_own"
  on public.blood_bank_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "blood_bank_settings_delete_own" on public.blood_bank_settings;
create policy "blood_bank_settings_delete_own"
  on public.blood_bank_settings
  for delete
  using (auth.uid() = user_id);
