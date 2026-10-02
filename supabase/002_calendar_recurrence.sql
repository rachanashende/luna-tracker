-- Module 3 — Calendar: recurrence support
-- Already applied to the live luna-tracker Supabase project (2026-10-02) via the
-- Supabase MCP tools once the project came back online — this file is kept for the
-- repo's record and for anyone rebuilding the DB from scratch, not something that
-- still needs running by hand.
-- Alters the base `events` table and adds `event_exceptions` for
-- per-occurrence edits/cancellations on recurring events.

alter table events
  add column if not exists recurrence_days smallint[],
  add column if not exists recurrence_end_date date;

comment on column events.recurrence_days is
  'Days of week this event repeats on (0=Sunday .. 6=Saturday, matches JS Date.getDay()). Null/empty = one-off event on `date`.';
comment on column events.recurrence_end_date is
  'Last date (inclusive) a recurring event generates occurrences for. Null = no end date.';

-- One row per edited/cancelled occurrence of a recurring event.
-- A row with is_cancelled = true hides that single occurrence.
-- A row with is_cancelled = false carries override fields (null = inherit from parent)
-- for a single-occurrence edit ("just this event").
create table if not exists event_exceptions (
  id uuid primary key default gen_random_uuid(),
  parent_event_id uuid not null references events(id) on delete cascade,
  occurrence_date date not null,
  is_cancelled boolean not null default false,
  title text,
  start_time time,
  end_time time,
  notes text,
  created_at timestamptz not null default now(),
  unique (parent_event_id, occurrence_date)
);

-- Matches the pattern already live on every other table (events, notes, journal,
-- pomodoro_logs, subjects, study_plan): RLS enabled, zero policies. Nothing in this
-- app ever queries Postgres with the anon key — API routes use the service-role
-- client exclusively, which bypasses RLS — so no policy is needed here either.
-- Confirmed via Supabase's security advisor after applying: this table shows the
-- same "RLS enabled, no policy" info-level note as the six tables from Module 1,
-- not a gap.
alter table event_exceptions enable row level security;

create index if not exists event_exceptions_parent_idx
  on event_exceptions (parent_event_id);
