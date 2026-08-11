-- HemoConnect360 - Nearby blood requests for a verified blood bank
-- Run this in the Supabase SQL Editor.
--
-- Reuses the existing public.blood_requests table and the existing
-- public.haversine_km() distance function from 2026-08-08-geo-matching.sql.
-- No new tables and no column changes.
--
-- The SECURITY DEFINER RPC blood_bank_nearby_requests:
--   1. resolves the signed-in blood bank's real coordinates from auth.uid()
--      (never trusts a latitude/longitude or blood_bank_id from the client),
--   2. returns open (or filtered) blood_requests whose haversine distance from
--      the bank is within the requested radius,
--   3. filters by blood group, priority, status and needed-by date range,
--   4. sorts by nearest / most urgent / newest,
--   5. paginates server-side and returns the exact total count for the filter.
-- The distance is computed in the database with the same haversine_km used by
-- donor matching, so distances are consistent across the whole app.
--
-- Banks without coordinates (no latitude/longitude on their profile) simply
-- receive an empty result - the frontend shows the "set your location" state.

create or replace function public.blood_bank_nearby_requests(
  p_radius_km double precision default 25,
  p_blood_group text default null,
  p_priority text default null,
  p_status text default 'open',
  p_from date default null,
  p_to date default null,
  p_sort text default 'nearest',
  p_page integer default 1,
  p_limit integer default 10
) returns table (
  id uuid,
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
  status text,
  latitude double precision,
  longitude double precision,
  accepted_by_blood_bank_id uuid,
  rejected_by_blood_bank_id uuid,
  rejection_reason text,
  accepted_at timestamptz,
  rejected_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  distance_km double precision,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lat      double precision;
  v_lng      double precision;
  v_radius   double precision;
  v_status   text;
  v_sort     text;
  v_page     integer;
  v_limit    integer;
  v_offset   integer;
  v_from     date;
  v_to       date;
  v_blood    text;
  v_priority text;
begin
  -- Ownership + location: resolved from the JWT, never from the caller.
  select b.latitude, b.longitude
    into v_lat, v_lng
  from public.blood_banks b
  where b.user_id = auth.uid()
  limit 1;

  if v_lat is null or v_lng is null then
    -- Not a blood bank, or the bank has no coordinates: nothing to compute.
    return;
  end if;

  v_radius   := greatest(least(coalesce(nullif(p_radius_km, 0), 25), 500), 1);
  v_status   := coalesce(nullif(p_status, ''), 'open');
  v_sort     := coalesce(nullif(p_sort, ''), 'nearest');
  v_page     := greatest(coalesce(p_page, 1), 1);
  v_limit    := greatest(least(coalesce(p_limit, 10), 50), 1);
  v_offset   := (v_page - 1) * v_limit;
  v_from     := p_from;
  v_to       := p_to;
  v_blood    := nullif(p_blood_group, '');
  v_priority := nullif(p_priority, '');

  return query
    select
      br.id,
      br.patient_name,
      br.patient_age,
      br.patient_gender,
      br.blood_group,
      br.units_required,
      br.hospital_name,
      br.city,
      br.hospital_address,
      br.required_by,
      br.priority,
      br.contact_name,
      br.contact_phone,
      br.contact_email,
      br.notes,
      br.status,
      br.latitude,
      br.longitude,
      br.accepted_by_blood_bank_id,
      br.rejected_by_blood_bank_id,
      br.rejection_reason,
      br.accepted_at,
      br.rejected_at,
      br.completed_at,
      br.created_at,
      br.updated_at,
      round(public.haversine_km(v_lat, v_lng, br.latitude, br.longitude)::numeric, 1)::double precision as distance_km,
      count(*) over() as total_count
    from public.blood_requests br
    where br.latitude is not null
      and br.longitude is not null
      and public.haversine_km(v_lat, v_lng, br.latitude, br.longitude) <= v_radius
      and (v_blood is null or br.blood_group = v_blood)
      and (v_priority is null or br.priority = v_priority)
      and (v_from is null or br.required_by >= v_from)
      and (v_to is null or br.required_by <= v_to)
      and (
        v_status = 'all'
        or (v_status = 'open' and br.status in ('submitted', 'notified', 'searching_donors', 'accepted'))
        or (v_status = 'decided' and br.status in ('approved', 'rejected', 'completed'))
        or br.status = v_status
      )
    order by
      case
        when v_sort = 'urgent' then
          case br.priority
            when 'critical' then 0
            when 'urgent' then 1
            when 'standard' then 2
            else 3
          end
        else 0
      end asc,
      case when v_sort = 'newest' then br.created_at end desc nulls last,
      case when v_sort = 'nearest' then distance_km end asc nulls last,
      br.created_at desc
    limit v_limit
    offset v_offset;
end;
$$;

grant execute on function public.blood_bank_nearby_requests(
  double precision, text, text, text, date, date, text, integer, integer
) to authenticated;
