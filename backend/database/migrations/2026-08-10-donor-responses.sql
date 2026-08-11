-- HemoConnect360 - Donor responses and acceptance cap
-- Run after the eligibility/matching migration.

-- Recreate the requester matches RPC with acceptance counts.
drop function if exists public.get_request_matches(uuid, uuid);

create or replace function public.get_request_matches(
  p_request_id uuid,
  p_requester_id uuid
)
returns table (
  donor_id uuid,
  full_name text,
  phone text,
  blood_group text,
  city text,
  distance_km double precision,
  match_score double precision,
  status text,
  accepted_count integer,
  max_accepted integer
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
      case
        when m.status in ('notified', 'accepted')
          and d.last_donation is not null
          and (current_date - d.last_donation) < public.donor_interval_days(d.gender)
          then 'ineligible_after_donation'
        else m.status
      end,
       (select count(*)::integer from public.donor_matches accepted
        join public.donors accepted_donor on accepted_donor.id = accepted.donor_id
        where accepted.blood_request_id = p_request_id
          and accepted.status in ('accepted', 'donated')
          and (
            accepted.status = 'donated'
            or accepted_donor.last_donation is null
            or (current_date - accepted_donor.last_donation) >= public.donor_interval_days(accepted_donor.gender)
          )),
      5
    from public.donor_matches m
    join public.donors d on d.id = m.donor_id
    where m.blood_request_id = p_request_id
    order by m.status = 'accepted' desc, m.distance_km asc nulls last;
end;
$$;

grant execute on function public.get_request_matches to anon, authenticated;

-- Recreate donor request RPC with acceptance counts and response status.
drop function if exists public.get_donor_requests(uuid);

create or replace function public.get_donor_requests(p_donor_id uuid)
returns table (
  request_id uuid,
  patient_name text,
  patient_age integer,
  patient_gender text,
  blood_group text,
  units_required integer,
  hospital_name text,
  city text,
  hospital_address text,
  contact_name text,
  contact_phone text,
  notes text,
  required_by date,
  priority text,
  request_status text,
  donor_response text,
  distance_km double precision,
  distance_band text,
  match_score double precision,
  accepted_count integer,
  max_accepted integer,
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
      br.patient_name,
      br.patient_age,
      br.patient_gender,
      br.blood_group,
      br.units_required,
      br.hospital_name,
      br.city,
      br.hospital_address,
      br.contact_name,
      br.contact_phone,
      br.notes,
      br.required_by,
      br.priority,
      case
        when exists (
          select 1 from public.donor_matches donated
          where donated.blood_request_id = br.id
            and donated.status = 'donated'
        ) then 'completed'
        else br.status
      end,
       case
         when m.status in ('notified', 'accepted')
           and d.last_donation is not null
           and (current_date - d.last_donation) < public.donor_interval_days(d.gender)
           then 'ineligible_after_donation'
         else m.status
       end,
      m.distance_km,
      case
        when m.distance_km <= 5 then 'Highest priority (0-5 km)'
        when m.distance_km <= 10 then 'High priority (5-10 km)'
        when m.distance_km <= 25 then 'Medium priority (10-25 km)'
        else 'Lower priority (25+ km)'
      end,
      m.match_score,
      (select count(*)::integer from public.donor_matches accepted
       where accepted.blood_request_id = br.id
         and accepted.status in ('accepted', 'donated')),
      5,
      m.matched_at
    from public.donor_matches m
    join public.blood_requests br on br.id = m.blood_request_id
    join public.donors d on d.id = m.donor_id
    where m.donor_id = p_donor_id
      and br.status not in ('cancelled', 'fulfilled')
    order by
      case br.priority when 'critical' then 1 when 'urgent' then 2 else 3 end,
      m.distance_km asc nulls last,
      br.required_by asc;
end;
$$;

grant execute on function public.get_donor_requests to authenticated;

-- Accept a match atomically. The row lock prevents a sixth donor from being
-- accepted when two donors respond at the same time.
create or replace function public.accept_donor_request(
  p_request_id uuid,
  p_donor_id uuid
)
returns table (accepted boolean, accepted_count integer, max_accepted integer, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_count integer;
  v_last_donation date;
  v_gender text;
begin
  if auth.uid() is distinct from p_donor_id then
    return query select false, 0, 5, 'You can only respond as yourself.';
    return;
  end if;

  perform 1 from public.donor_matches
  where blood_request_id = p_request_id
  for update;

  select m.status into v_status
  from public.donor_matches m
  where m.blood_request_id = p_request_id and m.donor_id = p_donor_id;

  if v_status is null then
    return query select false, 0, 5, 'This request is not assigned to you.';
    return;
  end if;

  select d.last_donation, d.gender
    into v_last_donation, v_gender
  from public.donors d
  where d.id = p_donor_id;

  if v_last_donation is not null
     and (current_date - v_last_donation) < public.donor_interval_days(v_gender) then
    return query select false, 0, 5, 'You are not currently eligible to donate again.';
    return;
  end if;

  select count(*)::integer into v_count
  from public.donor_matches
  where blood_request_id = p_request_id and status in ('accepted', 'donated');

  if v_status in ('accepted', 'donated') then
    return query select true, v_count, 5, 'You already accepted this request.';
    return;
  end if;

  if v_count >= 5 then
    return query select false, v_count, 5, 'This request already has five accepted donors.';
    return;
  end if;

  update public.donor_matches
  set status = 'accepted'
  where blood_request_id = p_request_id and donor_id = p_donor_id;

  return query select true, v_count + 1, 5, 'Request accepted.';
end;
$$;

create or replace function public.reject_donor_request(
  p_request_id uuid,
  p_donor_id uuid
)
returns table (rejected boolean, accepted_count integer, max_accepted integer, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is distinct from p_donor_id then
    return query select false, 0, 5, 'You can only respond as yourself.';
    return;
  end if;

  update public.donor_matches
  set status = 'rejected'
  where blood_request_id = p_request_id
    and donor_id = p_donor_id
    and status = 'notified';

  if not found then
    return query select false,
      (select count(*)::integer from public.donor_matches where blood_request_id = p_request_id and status in ('accepted', 'donated')),
      5,
      'This request cannot be rejected.';
    return;
  end if;

  select count(*)::integer into v_count
  from public.donor_matches
  where blood_request_id = p_request_id and status in ('accepted', 'donated');

  return query select true, v_count, 5, 'Request rejected.';
end;
$$;

grant execute on function public.accept_donor_request to authenticated;
grant execute on function public.reject_donor_request to authenticated;

-- Record whether an accepted donor actually completed donation. A negative
-- outcome removes that donor from the accepted count, allowing another donor
-- to take the open slot.
create or replace function public.record_donor_outcome(
  p_request_id uuid,
  p_donor_id uuid,
  p_donated boolean
)
returns table (updated boolean, accepted_count integer, max_accepted integer, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_count integer;
  v_hospital_name text;
  v_city text;
  v_units integer;
  v_requester_id uuid;
  v_blood_group text;
  v_affected_request_id uuid;
begin
  if auth.uid() is distinct from p_donor_id then
    return query select false, 0, 5, 'You can only respond as yourself.';
    return;
  end if;

  perform 1 from public.donor_matches
  where blood_request_id = p_request_id
  for update;

  select m.status into v_status
  from public.donor_matches m
  where m.blood_request_id = p_request_id and m.donor_id = p_donor_id;

  if v_status is null or v_status not in ('accepted', 'donated') then
    return query select false,
      (select count(*)::integer from public.donor_matches where blood_request_id = p_request_id and status in ('accepted', 'donated')),
      5,
      'Only an accepted donor can record a donation outcome.';
    return;
  end if;

  select br.requester_id, br.blood_group, br.hospital_name
    into v_requester_id, v_blood_group, v_hospital_name
  from public.blood_requests br
  where br.id = p_request_id;

  if v_status = 'donated' then
    return query select true,
      (select count(*)::integer from public.donor_matches where blood_request_id = p_request_id and status in ('accepted', 'donated')),
      5,
      'Donation outcome was already recorded.';
    return;
  end if;

  if p_donated then
    select br.hospital_name, br.city, br.units_required
      into v_hospital_name, v_city, v_units
    from public.blood_requests br
    where br.id = p_request_id;

    insert into public.donations (
      donor_id, donation_date, blood_bank, city, units, notes
    )
    values (
      p_donor_id,
      current_date,
      coalesce(v_hospital_name, 'Blood request donation'),
      v_city,
      greatest(coalesce(v_units, 1), 1),
      'Donation confirmed from blood request'
    );
  end if;

  update public.donor_matches
  set status = case when p_donated then 'donated' else 'declined' end
  where blood_request_id = p_request_id and donor_id = p_donor_id;

  if p_donated then
    for v_affected_request_id in
      update public.donor_matches
      set status = 'ineligible_after_donation'
      where donor_id = p_donor_id
        and blood_request_id <> p_request_id
        and status in ('notified', 'accepted')
      returning blood_request_id
    loop
      insert into public.notifications (
        recipient_type, recipient_id, request_id, type, title, message
      )
      select
        'requester', br.requester_id, br.id, 'donor_ineligible',
        'Donor is no longer available',
        'A matched donor completed another donation and is no longer eligible for this request.'
      from public.blood_requests br
      where br.id = v_affected_request_id;
    end loop;
  end if;

  insert into public.notifications (
    recipient_type, recipient_id, request_id, type, title, message
  )
  values
    (
      'requester', v_requester_id, p_request_id, 'donation_outcome',
      case when p_donated then 'Blood donation completed' else 'Donor could not complete donation' end,
      case when p_donated
        then 'A donor confirmed the donation at ' || coalesce(v_hospital_name, 'the hospital') || '.'
        else 'A donor reported that the donation was not completed. The acceptance slot is available again.'
      end
    ),
    (
      'donor', p_donor_id, p_request_id, 'donation_outcome',
      case when p_donated then 'Donation recorded' else 'Donation outcome recorded' end,
      case when p_donated
        then 'Your donation was recorded and your next eligibility date was updated.'
        else 'Your response was recorded. Another donor can now accept this request.'
      end
    );

  select count(*)::integer into v_count
  from public.donor_matches
  where blood_request_id = p_request_id and status in ('accepted', 'donated');

  return query select true, v_count, 5,
    case when p_donated then 'Donation recorded. Request completed.'
         else 'Donation declined. The acceptance slot is available again.'
    end;
end;
$$;

grant execute on function public.record_donor_outcome to authenticated;
