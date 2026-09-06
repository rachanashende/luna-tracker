-- Daily Tracker — base schema (BUILD_SPEC.md, section 0)
-- Run this once in the Supabase SQL editor after creating your project.
-- Later modules may ALTER these tables (e.g. Module 3 adds a
-- `recurrence_rule` column to `events` if recurring events are wanted).

create extension if not exists "pgcrypto";

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  start_time time,
  end_time time,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists journal (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  mood text,
  body text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists pomodoro_logs (
  id uuid primary key default gen_random_uuid(),
  subject text,
  duration_min integer not null,
  started_at timestamptz not null default now()
);

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  confidence integer check (confidence between 1 and 5),
  exam_date date,
  target_grade text,
  syllabus_text text
);

create table if not exists study_plan (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects (id) on delete cascade,
  date date not null,
  topic text not null,
  status text not null default 'pending',
  source text
);

-- This app has no per-user accounts (single shared password, checked
-- server-side). All reads/writes go through app/api/* routes using the
-- service-role key, which bypasses RLS — so RLS can stay locked down with
-- no public policies. Don't add permissive policies here; keep the browser
-- client (anon key) read-only or unused, per lib/supabase.ts.
alter table events enable row level security;
alter table notes enable row level security;
alter table journal enable row level security;
alter table pomodoro_logs enable row level security;
alter table subjects enable row level security;
alter table study_plan enable row level security;
