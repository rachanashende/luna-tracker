-- Module 5 — Journal
-- Extends the base `journal` table from schema.sql.
-- Multiple entries per day are allowed (no unique constraint on date).

alter table public.journal
  add column if not exists updated_at timestamptz not null default now();

-- A mood is optional: an entry can be text only.
alter table public.journal
  alter column mood drop not null;

-- Keep moods to the fixed set the UI offers (see lib/journal-moods.ts).
-- NOT VALID: don't fail if a stray legacy row exists; new writes are checked.
alter table public.journal
  drop constraint if exists journal_mood_check;
alter table public.journal
  add constraint journal_mood_check
  check (mood is null or mood in
    ('happy','calm','grateful','focused','tired','stressed','low'))
  not valid;

create index if not exists journal_date_idx
  on public.journal (date desc, created_at desc);
