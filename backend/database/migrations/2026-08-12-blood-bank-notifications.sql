-- HemoConnect360 - in-app notifications for blood banks
-- Run this in the Supabase SQL Editor.
--
-- Extends the existing public.notifications table (created in
-- 2026-08-10-notifications.sql) so a verified blood bank can receive and read
-- its own notifications. Blood bank notifications are keyed to the bank's
-- auth user id (recipient_id = blood_banks.user_id = auth.uid()), the same
-- pattern donors use.
--
-- Also adds blood_banks_nearby_request: a SECURITY DEFINER RPC that resolves
-- the banks "relevant" to a blood request (nearby by haversine distance when
-- the request has coordinates, otherwise same-city banks), mirroring the
-- existing donor/bank location matching logic.

-- 1. Allow blood_bank recipients in the notifications table.
alter table public.notifications
  drop constraint if exists notifications_recipient_type_check;

alter table public.notifications
  add constraint notifications_recipient_type_check
    check (recipient_type in ('donor', 'requester', 'blood_bank'));

-- 2. RLS: a blood bank may read and mark its own notifications.
drop policy if exists "blood_bank_notifications_select_own" on public.notifications;
create policy "blood_bank_notifications_select_own" on public.notifications
  for select using (recipient_type = 'blood_bank' and auth.uid() = recipient_id);

drop policy if exists "blood_bank_notifications_update_own" on public.notifications;
create policy "blood_bank_notifications_update_own" on public.notifications
  for update using (recipient_type = 'blood_bank' and auth.uid() = recipient_id)
  with check (recipient_type = 'blood_bank' and auth.uid() = recipient_id);

-- 3. Find verified banks relevant to a request (distance or same-city).
create or replace function public.blood_banks_nearby_request(
  p_request_id uuid,
  p_radius_km double precision default 25
) returns table (
  user_id uuid,
  blood_bank_id uuid,
  blood_bank_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lat    double precision;
  v_lng    double precision;
  v_city   text;
  v_radius double precision;
begin
  -- The request's location + city come from the real row, never the client.
  select b.latitude, b.longitude, b.city
    into v_lat, v_lng, v_city
  from public.blood_requests b
  where b.id = p_request_id;

  if not found then
    return;
  end if;

  v_radius := greatest(least(coalesce(nullif(p_radius_km, 0), 25), 500), 1);

  return query
    select bb.user_id, bb.id, bb.blood_bank_name
    from public.blood_banks bb
    where bb.verification_status in ('APPROVED', 'VERIFIED')
      and (
        (
          v_lat is not null
          and v_lng is not null
          and bb.latitude is not null
          and bb.longitude is not null
          and public.haversine_km(v_lat, v_lng, bb.latitude, bb.longitude) <= v_radius
        )
        or (
          (v_lat is null or v_lng is null)
          and v_city is not null
          and bb.city = v_city
        )
      )
    order by bb.blood_bank_name asc;
end;
$$;

grant execute on function public.blood_banks_nearby_request(uuid, double precision)
  to authenticated;
