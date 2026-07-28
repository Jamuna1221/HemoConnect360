create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  full_name text,
  age integer,
  gender text,
  city text,
  address text,
  blood_needed_for text,
  email text,
  role text not null default 'requester',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_phone_role_unique unique (phone, role)
);

create table if not exists public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  patient_name text,
  patient_age integer,
  patient_gender text,
  blood_group text,
  units_required integer,
  hospital_name text,
  city text,
  hospital_address text,
  required_by date,
  priority text,
  contact_name text,
  contact_phone text,
  contact_email text,
  notes text,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blood_requests_requester_id_created_at_idx
  on public.blood_requests (requester_id, created_at desc);
