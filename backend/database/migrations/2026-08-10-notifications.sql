-- HemoConnect360 - persistent in-app notifications

create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  recipient_type  text not null check (recipient_type in ('donor', 'requester')),
  recipient_id    uuid not null,
  request_id      uuid references public.blood_requests(id) on delete cascade,
  type            text not null,
  title           text not null,
  message         text not null,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_type, recipient_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "donor_notifications_select_own" on public.notifications;
create policy "donor_notifications_select_own" on public.notifications
  for select using (recipient_type = 'donor' and auth.uid() = recipient_id);

drop policy if exists "donor_notifications_update_own" on public.notifications;
create policy "donor_notifications_update_own" on public.notifications
  for update using (recipient_type = 'donor' and auth.uid() = recipient_id)
  with check (recipient_type = 'donor' and auth.uid() = recipient_id);
