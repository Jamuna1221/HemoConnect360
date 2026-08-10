-- Donor table for HemoConnect360
-- Run this in the Supabase SQL Editor.
--
-- users are identified by auth.users.id. Every donor row stores it in
-- user_id (references auth.users.id), and the app looks profiles up by
-- user_id at login — never by email.
--
-- RLS / email confirmation note:
-- The insert policy "donors_insert_own" requires auth.uid() = user_id, which
-- only holds once the user has a session. If "Confirm email" is enabled,
-- signUp returns NO session, so the client cannot insert the profile until the
-- email is verified; the frontend then creates it automatically in
-- /auth/callback (session exists -> RLS passes). If email confirmation is
-- disabled, signUp returns a session and the profile is inserted immediately.
-- No anon insert policy is required and none should be added.

create extension if not exists "pgcrypto";

create table if not exists public.donors (
  id            uuid        primary key references auth.users(id) on delete cascade,
  full_name     text        not null,
  dob           date        not null,
  gender        text        not null,
  blood_group   text        not null,
  phone         text        not null unique,
  email         text,
  address       text        not null,
  city          text        not null,
  state         text        not null,
  pincode       text        not null,
  weight        numeric     not null,
  hemoglobin    numeric     not null,
  last_donation date,
  id_proof      text,
  profile_pic   text,
  status        text        not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists donors_blood_group_city_idx
  on public.donors (blood_group, city);

create index if not exists donors_phone_idx
  on public.donors (phone);

-- Row Level Security ---------------------------------------------------------
alter table public.donors enable row level security;

drop policy if exists "donors_insert_own" on public.donors;
create policy "donors_insert_own" on public.donors
  for insert with check (auth.uid() = id);

drop policy if exists "donors_select_own" on public.donors;
create policy "donors_select_own" on public.donors
  for select using (auth.uid() = id);

drop policy if exists "donors_update_own" on public.donors;
create policy "donors_update_own" on public.donors
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Storage bucket for ID proofs ----------------------------------------------
insert into storage.buckets (id, name, public)
values ('donor-docs', 'donor-docs', true)
on conflict (id) do nothing;

-- Authenticated users may upload only into their own folder: <user-id>/...
drop policy if exists "donor_docs_upload_own" on storage.objects;
create policy "donor_docs_upload_own" on storage.objects
  for insert
  with check (
    bucket_id = 'donor-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read access for uploaded documents
drop policy if exists "donor_docs_public_read" on storage.objects;
create policy "donor_docs_public_read" on storage.objects
  for select
  using (bucket_id = 'donor-docs');

-- Optional profile picture for the donor -------------------------------------
alter table public.donors add column if not exists profile_pic text;

-- Storage bucket for donor profile pictures ----------------------------------
insert into storage.buckets (id, name, public)
values ('donor-avatars', 'donor-avatars', true)
on conflict (id) do nothing;

-- Authenticated users may upload only into their own folder: <user-id>/...
drop policy if exists "donor_avatars_upload_own" on storage.objects;
create policy "donor_avatars_upload_own" on storage.objects
  for insert
  with check (
    bucket_id = 'donor-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read access for profile pictures
drop policy if exists "donor_avatars_public_read" on storage.objects;
create policy "donor_avatars_public_read" on storage.objects
  for select
  using (bucket_id = 'donor-avatars');
