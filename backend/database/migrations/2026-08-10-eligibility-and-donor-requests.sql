-- HemoConnect360 - Eligibility-aware donor matching
-- Run this after 2026-08-08-geo-matching.sql.
--
-- This is an MVP matching aid, not a medical compatibility guarantee.
-- Final compatibility must be confirmed by the blood bank.

create or replace function public.blood_group_compatible(
  donor_group text,
  required_group text
) returns boolean
language sql
immutable
as $$
  select case
    when donor_group is null or required_group is null then false
    when required_group = 'O-' then donor_group = 'O-'
    when required_group = 'O+' then donor_group in ('O-', 'O+')
    when required_group = 'A-' then donor_group in ('O-', 'A-')
    when required_group = 'A+' then donor_group in ('O-', 'O+', 'A-', 'A+')
    when required_group = 'B-' then donor_group in ('O-', 'B-')
    when required_group = 'B+' then donor_group in ('O-', 'O+', 'B-', 'B+')
    when required_group = 'AB-' then donor_group in ('O-', 'A-', 'B-', 'AB-')
    when required_group = 'AB+' then donor_group in ('O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+')
    else false
  end
$$;

create or replace function public.donor_interval_days(donor_gender text)
returns integer
language sql
immutable
as $$
  -- Unknown/other gender uses the more conservative interval.
  select case when lower(coalesce(donor_gender, '')) = 'male' then 90 else 120 end
$$;

create or replace function public.match_nearby_donors(
  p_request_id      uuid,
  p_latitude        double precision,
  p_longitude       double precision,
  p_required_group  text,
  p_required_by     date,
  p_radius_km       double precision default 25,
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
  v_effective_date date := current_date;
begin
  delete from public.donor_matches where blood_request_id = p_request_id;

  for r in
    select
      d.id,
      d.full_name,
      d.phone,
      d.blood_group,
      d.city,
      public.haversine_km(d.latitude, d.longitude, p_latitude, p_longitude) as distance_km,
      case
        when public.haversine_km(d.latitude, d.longitude, p_latitude, p_longitude) <= 5 then 4
        when public.haversine_km(d.latitude, d.longitude, p_latitude, p_longitude) <= 10 then 3
        when public.haversine_km(d.latitude, d.longitude, p_latitude, p_longitude) <= 25 then 2
        else 1
      end as distance_priority
    from public.donors d
    where d.status = 'active'
      and d.latitude is not null
      and d.longitude is not null
      and public.blood_group_compatible(d.blood_group, p_required_group)
      and (
        d.last_donation is null
        or (v_effective_date - d.last_donation) >= public.donor_interval_days(d.gender)
      )
    order by distance_priority desc, distance_km asc
    limit greatest(p_max_donors, 1)
  loop
    if r.distance_km <= p_radius_km then
      insert into public.donor_matches (
        blood_request_id, donor_id, distance_km, match_score, status
      )
      values (
        p_request_id,
        r.id,
        round(r.distance_km::numeric, 1)::double precision,
        round(((r.distance_priority * 100.0) + (100.0 / (1.0 + r.distance_km)))::numeric, 1)::double precision,
        'notified'
      )
      on conflict on constraint donor_matches_request_donor_unique
      do update set
        distance_km = excluded.distance_km,
        match_score = excluded.match_score,
        status = 'notified',
        matched_at = now();

      return query
        select r.id, r.full_name, r.phone, r.blood_group, r.city, round(r.distance_km::numeric, 1)::double precision;
    end if;
  end loop;
end;
$$;

grant execute on function public.donor_interval_days to authenticated;
grant execute on function public.match_nearby_donors to anon, authenticated;

-- Donors can see only active requests matched to their own donor id.
create or replace function public.get_donor_requests(p_donor_id uuid)
returns table (
  request_id uuid,
  blood_group text,
  units_required integer,
  hospital_name text,
  city text,
  hospital_address text,
  required_by date,
  priority text,
  status text,
  distance_km double precision,
  distance_band text,
  match_score double precision,
  matched_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is distinct from p_donor_id then
    return;
  end if;

  return query
    select
      br.id,
      br.blood_group,
      br.units_required,
      br.hospital_name,
      br.city,
      br.hospital_address,
      br.required_by,
      br.priority,
      br.status,
      m.distance_km,
      case
        when m.distance_km <= 5 then 'Highest priority (0-5 km)'
        when m.distance_km <= 10 then 'High priority (5-10 km)'
        when m.distance_km <= 25 then 'Medium priority (10-25 km)'
        else 'Lower priority (25+ km)'
      end,
      m.match_score,
      m.matched_at
    from public.donor_matches m
    join public.blood_requests br on br.id = m.blood_request_id
    where m.donor_id = p_donor_id
      and br.status not in ('cancelled', 'fulfilled')
    order by
      case br.priority when 'urgent' then 1 when 'high' then 2 else 3 end,
      m.distance_km asc nulls last,
      br.required_by asc;
end;
$$;

grant execute on function public.get_donor_requests to authenticated;
