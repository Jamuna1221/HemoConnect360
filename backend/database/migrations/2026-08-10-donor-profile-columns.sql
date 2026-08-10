-- HemoConnect360 - Donor profile columns used by the frontend registration
-- Run this in the Supabase SQL Editor.

alter table public.donors
  add column if not exists id_proof text,
  add column if not exists profile_pic text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
