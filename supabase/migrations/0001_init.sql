-- Open Mic Night — initial schema
-- Design notes:
--   * No Supabase Auth. Public reads are allowed via RLS (SELECT using true).
--   * All writes go through Next.js server actions using the service role key,
--     which bypasses RLS, so no INSERT/UPDATE/DELETE policies are needed for anon.
--   * The host token hash lives in a separate `event_secrets` table with no anon
--     access, so it can never leak through the public `events` table or Realtime.

create extension if not exists "pgcrypto";

-- =========================================================================
-- events
-- =========================================================================
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  event_date  date,
  start_time  time,
  end_time    time,
  status      text not null default 'open'
              check (status in ('draft', 'open', 'live', 'finished', 'expired')),
  settings    jsonb not null default jsonb_build_object(
                'songs', 3,
                'songDurationMinutes', 4,
                'songChangeMinutes', 1,
                'setupMinutes', jsonb_build_object('solo', 2, 'duo', 3, 'band', 5)
              ),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '18 hours'
);

create index if not exists events_expires_at_idx on public.events (expires_at);

-- =========================================================================
-- event_secrets — host token hash, service-role only
-- =========================================================================
create table if not exists public.event_secrets (
  event_id   uuid primary key references public.events (id) on delete cascade,
  token_hash text not null
);

-- =========================================================================
-- performers
-- =========================================================================
create table if not exists public.performers (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events (id) on delete cascade,
  display_name     text not null,
  performance_type text not null default 'solo'
                   check (performance_type in ('solo', 'duo', 'band')),
  songs            integer not null default 3 check (songs between 1 and 10),
  status           text not null default 'queued'
                   check (status in ('queued', 'performing', 'completed')),
  queue_position   integer not null default 0,
  setup_override   integer check (setup_override is null or setup_override >= 0),
  created_at       timestamptz not null default now()
);

create index if not exists performers_event_position_idx
  on public.performers (event_id, queue_position);

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table public.events        enable row level security;
alter table public.event_secrets enable row level security;
alter table public.performers    enable row level security;

-- Public can read events and performers (needed for public pages + Realtime).
drop policy if exists "events are publicly readable" on public.events;
create policy "events are publicly readable"
  on public.events for select
  using (true);

drop policy if exists "performers are publicly readable" on public.performers;
create policy "performers are publicly readable"
  on public.performers for select
  using (true);

-- event_secrets: no policies => anon/authenticated denied. Lock down grants too.
revoke all on public.event_secrets from anon, authenticated;

-- =========================================================================
-- Realtime
-- =========================================================================
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.performers;

-- =========================================================================
-- Cleanup: delete everything for events that expired. Cascades to
-- performers + event_secrets via the ON DELETE CASCADE foreign keys.
-- =========================================================================
create or replace function public.delete_expired_events()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  with removed as (
    delete from public.events where expires_at < now() returning id
  )
  select count(*) into deleted_count from removed;
  return deleted_count;
end;
$$;

revoke all on function public.delete_expired_events() from anon, authenticated;
