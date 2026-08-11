-- HemoConnect360 - Blood bank registration
-- Run this in the Supabase SQL Editor.
--
-- A blood bank profile is always tied to the authenticated Supabase user
-- through user_id (references auth.users.id). user_id is UNIQUE so one user
-- can never create more than one profile. The user is created by the backend
-- via the Supabase Admin API with email_confirm: true (POST
-- /api/blood-banks/register) - never from client input.
--
-- The profile always starts in PENDING_VERIFICATION. The BEFORE INSERT/UPDATE
-- trigger "blood_banks_verify_guard" forces the initial status and locks the
-- verification columns (verification_status, verification_notes, verified_at,
-- verified_by) so that neither the registration page nor a direct client write
-- can self-approve. Only an admin process (future SECURITY DEFINER function)
-- will be able to change them.
--
-- RLS / email confirmation note (same pattern as public.donors):
-- The insert policy requires auth.uid() = user_id, which only holds once the
-- user has a session. Blood Bank registration intentionally has NO email
-- verification: the backend creates the auth account through the Supabase
-- Admin API with email_confirm: true (service-role key, server-side only) and
-- then inserts the profile row with the same service-role client, which
-- bypasses RLS. This works whether or not the Supabase Auth setting "Confirm
-- email" is enabled. The frontend never signs up on its own and never needs
-- the service-role key.
-- No anon insert policy is required and none should be added.

create extension if not exists "pgcrypto";

create table if not exists public.blood_banks (
  id                          uuid        primary key default gen_random_uuid(),
  user_id                     uuid        not null unique references auth.users(id) on delete cascade,

  blood_bank_name             text        not null,
  registration_number         text        not null unique,
  blood_bank_type             text        not null,
  established_year            integer,

  official_email              text        not null unique,
  primary_phone               text        not null,
  alternate_phone             text,

  address_line                text        not null,
  city                        text        not null,
  district                    text,
  state                       text        not null,
  pincode                     text        not null,
  latitude                    numeric,
  longitude                   numeric,

  authorized_person_name      text        not null,
  designation                 text        not null,
  authorized_person_phone     text        not null,
  authorized_person_email     text,

  verification_status         text        not null default 'PENDING_VERIFICATION',
  verification_notes          text,
  verified_at                 timestamptz,
  verified_by                 uuid        references auth.users(id) on delete set null,

  license_doc_path            text,
  authorization_doc_path      text,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  constraint blood_banks_blood_bank_type_check
    check (blood_bank_type in (
      'Government Blood Bank',
      'Private Blood Bank',
      'Hospital Blood Bank',
      'NGO / Trust Blood Bank',
      'Other'
    )),
  constraint blood_banks_established_year_check
    check (established_year between 1800 and date_part('year', now())::int),
  constraint blood_banks_official_email_check
    check (official_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint blood_banks_primary_phone_check
    check (primary_phone ~ '^[0-9]{10}$'),
  constraint blood_banks_alternate_phone_check
    check (alternate_phone is null or alternate_phone ~ '^[0-9]{10}$'),
  constraint blood_banks_authorized_person_phone_check
    check (authorized_person_phone ~ '^[0-9]{10}$'),
  constraint blood_banks_pincode_check
    check (pincode ~ '^[0-9]{6}$'),
  constraint blood_banks_latitude_check
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint blood_banks_longitude_check
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  constraint blood_banks_verification_status_check
    check (verification_status in ('PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'VERIFIED'))
);

create index if not exists blood_banks_city_idx
  on public.blood_banks (city);

create index if not exists blood_banks_status_idx
  on public.blood_banks (verification_status);

create index if not exists blood_banks_primary_phone_idx
  on public.blood_banks (primary_phone);

-- Verification-state guard ----------------------------------------------------
-- Forces every new profile to PENDING_VERIFICATION and locks the verification
-- columns so the owner (or any direct client write) cannot self-approve.
create or replace function public.blood_banks_verify_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.verification_status := 'PENDING_VERIFICATION';
    new.verification_notes := null;
    new.verified_at := null;
    new.verified_by := null;
  elsif tg_op = 'UPDATE' then
    new.verification_status := old.verification_status;
    new.verification_notes := old.verification_notes;
    new.verified_at := old.verified_at;
    new.verified_by := old.verified_by;
  end if;
  return new;
end;
$$;

drop trigger if exists blood_banks_verify_guard on public.blood_banks;
create trigger blood_banks_verify_guard
  before insert or update on public.blood_banks
  for each row execute function public.blood_banks_verify_guard();

-- Row Level Security ---------------------------------------------------------
alter table public.blood_banks enable row level security;

drop policy if exists "blood_banks_insert_own" on public.blood_banks;
create policy "blood_banks_insert_own" on public.blood_banks
  for insert with check (auth.uid() = user_id);

drop policy if exists "blood_banks_select_own" on public.blood_banks;
create policy "blood_banks_select_own" on public.blood_banks
  for select using (auth.uid() = user_id);

drop policy if exists "blood_banks_update_own" on public.blood_banks;
create policy "blood_banks_update_own" on public.blood_banks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Duplicate-check helper (SECURITY DEFINER) -----------------------------------
-- The backend API must be able to detect duplicate registration numbers and
-- official emails across ALL blood banks, not just the caller's own row (RLS
-- would hide other users' rows). This function runs with definer privileges,
-- bypasses RLS internally, and only returns booleans - it never exposes the
-- underlying rows.
create or replace function public.blood_banks_registration_conflicts(
  p_registration_number text,
  p_official_email text
) returns table (registration_number_taken boolean, official_email_taken boolean)
language sql
security definer
set search_path = public
as $$
  select
    exists (select 1 from public.blood_banks where registration_number = p_registration_number),
    exists (select 1 from public.blood_banks where official_email = p_official_email);
$$;

grant execute on function public.blood_banks_registration_conflicts(text, text)
  to authenticated;

-- Storage bucket for verification documents ----------------------------------
insert into storage.buckets (id, name, public)
values ('blood-bank-docs', 'blood-bank-docs', true)
on conflict (id) do update set public = true;

-- Authenticated users may upload only into their own folder: <user-id>/...
drop policy if exists "blood_bank_docs_upload_own" on storage.objects;
create policy "blood_bank_docs_upload_own" on storage.objects
  for insert
  with check (
    bucket_id = 'blood-bank-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read access for uploaded documents (admin review + verification)
drop policy if exists "blood_bank_docs_public_read" on storage.objects;
create policy "blood_bank_docs_public_read" on storage.objects
  for select
  using (bucket_id = 'blood-bank-docs');
