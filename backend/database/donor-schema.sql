-- Donor table for HemoConnect360
-- Run this in Supabase SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.donors (
  id            uuid        primary key default gen_random_uuid(),
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
  status        text        not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

create index if not exists donors_blood_group_city_idx
  on public.donors (blood_group, city);

create index if not exists donors_phone_idx
  on public.donors (phone);
