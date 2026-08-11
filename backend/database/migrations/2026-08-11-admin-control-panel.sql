-- HemoConnect360 - Admin Control Panel
-- Run this in the Supabase SQL Editor.
--
-- Backend support for the six Admin Dashboard sections:
--   Verification Center, Security/Fraud monitoring, Reports & Analytics,
--   Notifications, Audit Logs and Admin Profile/Settings.
--
-- Existing tables are REUSED (public.donors, public.users, public.blood_banks,
-- public.blood_requests, public.blood_bank_inventory) and only extended with
-- the minimum columns required for admin workflows. New tables are created only
-- where no equivalent exists (admin_notifications, audit_logs,
-- suspicious_activity, admin_settings).
--
-- The blood_banks verification columns are locked by the existing
-- blood_banks_verify_guard trigger, so a SECURITY DEFINER function
-- (admin_set_blood_bank_verification) is provided - the same pattern used by
-- the blood bank inventory RPCs - as the only way to change verification state.
-- The service-role key is used server-side only and never exposed to clients.

--------------------------------------------------------------------------------
-- 1. Donor verification columns (reuses public.donors)
--------------------------------------------------------------------------------
alter table public.donors
  add column if not exists verification_status text not null default 'pending',
  add column if not exists verification_notes text,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id) on delete set null;

alter table public.donors
  drop constraint if exists donors_verification_status_check;

alter table public.donors
  add constraint donors_verification_status_check
  check (verification_status in ('pending', 'under_review', 'verified', 'rejected', 'reverification_required'));

create index if not exists donors_verification_status_idx
  on public.donors (verification_status);

--------------------------------------------------------------------------------
-- 2. Requester (users) verification + account columns (reuses public.users)
--------------------------------------------------------------------------------
alter table public.users
  add column if not exists verification_status text not null default 'pending',
  add column if not exists verification_notes text,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id) on delete set null,
  add column if not exists account_status text not null default 'active';

alter table public.users
  drop constraint if exists users_verification_status_check;

alter table public.users
  add constraint users_verification_status_check
  check (verification_status in ('pending', 'under_review', 'verified', 'rejected', 'reverification_required'));

alter table public.users
  drop constraint if exists users_account_status_check;

alter table public.users
  add constraint users_account_status_check
  check (account_status in ('active', 'warned', 'suspended', 'blocked'));

--------------------------------------------------------------------------------
-- 3. Admin notifications (announcements + system notifications)
--------------------------------------------------------------------------------
create table if not exists public.admin_notifications (
  id          uuid        primary key default gen_random_uuid(),
  type        text        not null,
  title       text        not null,
  description text,
  priority    text        not null default 'normal',
  audience    text        not null default 'all',
  source_key  text,
  is_read     boolean     not null default false,
  read_at     timestamptz,
  created_by  uuid        references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),

  constraint admin_notifications_type_check
    check (type in ('REGISTRATION', 'BLOOD_REQUEST', 'VERIFICATION', 'URGENT_REQUEST', 'SECURITY', 'SYSTEM', 'ANNOUNCEMENT')),
  constraint admin_notifications_priority_check
    check (priority in ('normal', 'important', 'urgent')),
  constraint admin_notifications_audience_check
    check (audience in ('all', 'donors', 'requesters', 'blood_banks'))
);

-- Deduplication key for system notifications (source_key must be unique when
-- present; multiple NULLs are allowed for announcements).
create unique index if not exists admin_notifications_source_key_non_null_idx
  on public.admin_notifications (source_key)
  where source_key is not null;

create index if not exists admin_notifications_created_at_idx
  on public.admin_notifications (created_at desc);

--------------------------------------------------------------------------------
-- 4. Audit logs (read-only admin activity history)
--------------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id              uuid         primary key default gen_random_uuid(),
  admin_email     text,
  action          text         not null,
  action_category text,
  target          text,
  description     text,
  status          text         not null default 'Success',
  previous_value  text,
  new_value       text,
  metadata        jsonb,
  created_at      timestamptz  not null default now()
);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

--------------------------------------------------------------------------------
-- 5. Suspicious activity flags (security monitoring)
--------------------------------------------------------------------------------
create table if not exists public.suspicious_activity (
  id             uuid        primary key default gen_random_uuid(),
  source_key     text        unique,
  user_type      text        not null,
  user_id        text,
  user_name      text,
  user_email     text,
  activity_type  text        not null,
  reason_flagged text,
  risk_level     text        not null default 'low',
  status         text        not null default 'FLAGGED',
  details        jsonb,
  admin_action   text,
  admin_note     text,
  created_by     uuid        references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint suspicious_activity_risk_level_check
    check (risk_level in ('low', 'medium', 'high')),
  constraint suspicious_activity_status_check
    check (status in ('FLAGGED', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'))
);

create index if not exists suspicious_activity_status_idx
  on public.suspicious_activity (status);

create index if not exists suspicious_activity_created_at_idx
  on public.suspicious_activity (created_at desc);

--------------------------------------------------------------------------------
-- 6. Admin settings / profile (singleton row id = 1)
--------------------------------------------------------------------------------
create table if not exists public.admin_settings (
  id                 integer     primary key default 1 check (id = 1),
  full_name          text        default 'System Admin',
  notification_prefs jsonb       not null default '{"email": true, "urgent": true, "verification": true, "security": true, "system": true}',
  system_prefs       jsonb       not null default '{"default_tab": "dashboard", "items_per_page": 20}',
  last_login         timestamptz,
  updated_at         timestamptz not null default now()
);

--------------------------------------------------------------------------------
-- 7. Blood bank verification RPC (SECURITY DEFINER)
--------------------------------------------------------------------------------
-- The blood_banks_verify_guard trigger forces every new row to
-- PENDING_VERIFICATION and locks the verification columns on UPDATE, so no
-- direct client write (nor a plain service-role UPDATE) can change them.
-- This function is the only supported admin path: it temporarily disables the
-- guard inside a single transaction, applies the verified outcome, and
-- re-enables it. It refuses invalid statuses before touching any row.
create or replace function public.admin_set_blood_bank_verification(
  p_blood_bank_id     uuid,
  p_verification_status text,
  p_verification_notes text,
  p_admin_user_id     uuid
) returns table (verification_status text, verified_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_verification_status not in ('PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'VERIFIED') then
    raise exception 'INVALID_STATUS';
  end if;

  alter table public.blood_banks disable trigger blood_banks_verify_guard;

  update public.blood_banks
  set verification_status = p_verification_status,
      verification_notes = nullif(trim(p_verification_notes), ''),
      verified_at = case when p_verification_status = 'PENDING_VERIFICATION' then null else now() end,
      verified_by = case when p_verification_status = 'PENDING_VERIFICATION' then null else p_admin_user_id end,
      updated_at = now()
  where id = p_blood_bank_id;

  alter table public.blood_banks enable trigger blood_banks_verify_guard;

  return query select b.verification_status, b.verified_at
  from public.blood_banks b
  where b.id = p_blood_bank_id;
end;
$$;

grant execute on function public.admin_set_blood_bank_verification(uuid, text, text, uuid)
  to authenticated;

--------------------------------------------------------------------------------
-- 8. Row Level Security for admin-only tables
--------------------------------------------------------------------------------
-- These four tables are ADMIN ONLY. They are read/written exclusively through
-- the backend admin API, which uses the service-role client (service_role
-- bypasses RLS). Normal donors/requesters (anon / authenticated keys) must not
-- see or modify any of this data, so RLS is enabled and no row-level policy is
-- granted to them; their table privileges are revoked as well.
alter table public.admin_notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.suspicious_activity enable row level security;
alter table public.admin_settings enable row level security;

revoke all on public.admin_notifications from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;
revoke all on public.suspicious_activity from anon, authenticated;
revoke all on public.admin_settings from anon, authenticated;
