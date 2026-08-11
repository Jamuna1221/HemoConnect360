-- HemoConnect360 - Web push token storage

create table if not exists public.donor_push_tokens (
  id            uuid primary key default gen_random_uuid(),
  donor_id      uuid not null references public.donors(id) on delete cascade,
  token         text not null unique,
  platform      text not null default 'web',
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create index if not exists donor_push_tokens_donor_idx
  on public.donor_push_tokens (donor_id);

alter table public.donor_push_tokens enable row level security;

drop policy if exists "donor_push_tokens_insert_own" on public.donor_push_tokens;
create policy "donor_push_tokens_insert_own" on public.donor_push_tokens
  for insert with check (auth.uid() = donor_id);

drop policy if exists "donor_push_tokens_select_own" on public.donor_push_tokens;
create policy "donor_push_tokens_select_own" on public.donor_push_tokens
  for select using (auth.uid() = donor_id);

drop policy if exists "donor_push_tokens_update_own" on public.donor_push_tokens;
create policy "donor_push_tokens_update_own" on public.donor_push_tokens
  for update using (auth.uid() = donor_id) with check (auth.uid() = donor_id);

drop policy if exists "donor_push_tokens_delete_own" on public.donor_push_tokens;
create policy "donor_push_tokens_delete_own" on public.donor_push_tokens
  for delete using (auth.uid() = donor_id);
