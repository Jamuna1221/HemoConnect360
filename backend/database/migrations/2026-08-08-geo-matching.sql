-- HemoConnect360 - Geo Location + Donor Matching
-- Run this in the Supabase SQL Editor.
--
-- Adds latitude/longitude to donors, requesters (users) and blood_requests,
-- a donor_matches table to persist match results, and SECURITY DEFINER RPC
-- functions used by the backend (they run as the table owner, bypassing RLS,
-- so the backend's anon key can query nearby eligible donors and store matches).
--
-- Grant EXECUTE on each function to anon + authenticated so the backend and
-- the client can call them through the REST API.

-------------------------------------------------------------------------------
-- 1. Geo columns
-------------------------------------------------------------------------------
alter table public.donors
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

alter table public.users
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

alter table public.blood_requests
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

create index if not exists donors_lat_lng_idx
  on public.donors (latitude, longitude);

create index if not exists donors_status_idx
  on public.donors (status);

-------------------------------------------------------------------------------
-- 2. donor_matches table (request <-> donor)
-------------------------------------------------------------------------------
create table if not exists public.donor_matches (
  id                uuid primary key default gen_random_uuid(),
  blood_request_id  uuid not null references public.blood_requests(id) on delete cascade,
  donor_id          uuid not null references public.donors(id) on delete cascade,
  distance_km       double precision,
  match_score       double precision,
  status            text not null default 'notified',
  matched_at        timestamptz not null default now(),
  constraint donor_matches_request_donor_unique unique (blood_request_id, donor_id)
);

create index if not exists donor_matches_request_idx
  on public.donor_matches (blood_request_id);

create index if not exists donor_matches_donor_idx
  on public.donor_matches (donor_id);

-------------------------------------------------------------------------------
-- 3. Helper functions
-------------------------------------------------------------------------------

-- Haversine distance in kilometres between two lat/lng points.
create or replace function public.haversine_km(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
) returns double precision
language sql
immutable
as $$
  select 2 * 6371 * asin(
    sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2)
      + cos(radians(lat1)) * cos(radians(lat2))
        * power(sin(radians(lon2 - lon1) / 2), 2)
    )
  )
$$;

-- Blood group compatibility: can a donor with `donor_group` safely donate to
-- a patient requiring `required_group`.
create or replace function public.blood_group_compatible(
  donor_group text,
  required_group text
) returns boolean
language sql
immutable
as $$
  select
    donor_group = 'O-'                                    -- universal donor
    or required_group = donor_group                       -- exact match
    or (donor_group = 'O+' and required_group in ('A+', 'B+', 'AB+'))
    or (donor_group = 'A-' and required_group in ('A+', 'AB-', 'AB+'))
    or (donor_group = 'A+' and required_group = 'AB+')
    or (donor_group = 'B-' and required_group in ('B+', 'AB-', 'AB+'))
    or (donor_group = 'B+' and required_group = 'AB+')
    or (donor_group = 'AB-' and required_group = 'AB+')
    or donor_group is null
    or required_group is null
$$;

-------------------------------------------------------------------------------
-- 4. Matching RPC - used by the backend when a blood request is created.
-- Security definer so it can read eligible donors across all donors,
-- bypassing the donors_select_own RLS policy.
-------------------------------------------------------------------------------
create or replace function public.match_nearby_donors(
  p_request_id      uuid,
  p_latitude        double precision,
  p_longitude       double precision,
  p_required_group  text,
  p_required_by     date,
  p_radius_km       double precision default 10,
  p_max_donors      integer default 25
) returns table (
  donor_id    uuid,
  full_name   text,
  phone       text,
  blood_group text,
  city        text,
  distance_km double precision
)
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_effective_date date := coalesce(p_required_by, current_date);
begin
  -- Re-running a match resets previous results for the same request.
  delete from public.donor_matches where blood_request_id = p_request_id;

  for r in
    select
      d.id,
      d.full_name,
      d.phone,
      d.blood_group,
      d.city,
      public.haversine_km(d.latitude, d.longitude, p_latitude, p_longitude) as distance_km
    from public.donors d
    where d.status = 'active'
      and d.latitude is not null
      and d.longitude is not null
      and public.blood_group_compatible(d.blood_group, p_required_group)
      -- 90-day rule between last donation and the required-by date
      and (
        d.last_donation is null
        or (v_effective_date - d.last_donation) >= 90
      )
    order by distance_km asc
  loop
    if r.distance_km <= p_radius_km then
      insert into public.donor_matches (blood_request_id, donor_id, distance_km, match_score, status)
      values (
        p_request_id,
        r.id,
        round(r.distance_km, 1),
        round(100.0 / (1.0 + r.distance_km), 1),
        'notified'
      )
      on conflict (blood_request_id, donor_id)
      do update set distance_km = excluded.distance_km, match_score = excluded.match_score;

      return query
        select r.id, r.full_name, r.phone, r.blood_group, r.city, round(r.distance_km, 1);
    end if;
  end loop;
end;
$$;

grant execute on function public.haversine_km to anon, authenticated;
grant execute on function public.blood_group_compatible to anon, authenticated;
grant execute on function public.match_nearby_donors to anon, authenticated;

-------------------------------------------------------------------------------
-- 5. Read matches RPC - only the requester who owns the request can read them.
-- Security definer so it can join requesters/donors without RLS in the way.
-------------------------------------------------------------------------------
create or replace function public.get_request_matches(
  p_request_id  uuid,
  p_requester_id uuid
)
returns table (
  donor_id    uuid,
  full_name   text,
  phone       text,
  blood_group text,
  city        text,
  distance_km double precision,
  match_score double precision,
  status      text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.blood_requests br
    where br.id = p_request_id and br.requester_id = p_requester_id
  ) then
    return;
  end if;

  return query
    select
      d.id,
      d.full_name,
      d.phone,
      d.blood_group,
      d.city,
      m.distance_km,
      m.match_score,
      m.status
    from public.donor_matches m
    join public.donors d on d.id = m.donor_id
    where m.blood_request_id = p_request_id
    order by m.distance_km asc nulls last
    limit 50;
end;
$$;

grant execute on function public.get_request_matches to anon, authenticated;