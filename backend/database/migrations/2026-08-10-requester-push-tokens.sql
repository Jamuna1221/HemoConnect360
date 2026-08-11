-- HemoConnect360 - Requester web push token storage

create table if not exists public.requester_push_tokens (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.users(id) on delete cascade,
  token         text not null unique,
  platform      text not null default 'web',
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create index if not exists requester_push_tokens_requester_idx
  on public.requester_push_tokens (requester_id);
