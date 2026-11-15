-- Module 9 — Multi-user accounts.
--
-- Gives every row an owner (user_id -> auth.users) and turns on row-level
-- security so each signed-in user can only see and change their own rows.
--
-- Safe to run more than once. Run it in the Supabase SQL editor.
--
-- IMPORTANT: existing rows get user_id = NULL, which makes them invisible to
-- everyone until you run 006_claim_existing_data.sql after creating your own
-- account in the app.

-- 1) Owner column on every table. New rows default to the signed-in user.
alter table public.events           add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();
alter table public.event_exceptions add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();
alter table public.notes            add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();
alter table public.note_folders     add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();
alter table public.journal          add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();
alter table public.pomodoro_logs    add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();
alter table public.subjects         add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();
alter table public.study_plan       add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();

create index if not exists events_user_id_idx           on public.events (user_id);
create index if not exists event_exceptions_user_id_idx on public.event_exceptions (user_id);
create index if not exists notes_user_id_idx            on public.notes (user_id);
create index if not exists note_folders_user_id_idx     on public.note_folders (user_id);
create index if not exists journal_user_id_idx          on public.journal (user_id);
create index if not exists pomodoro_logs_user_id_idx    on public.pomodoro_logs (user_id);
create index if not exists subjects_user_id_idx         on public.subjects (user_id);
create index if not exists study_plan_user_id_idx       on public.study_plan (user_id);

-- 2) Row-level security. Make sure it is on everywhere.
alter table public.events           enable row level security;
alter table public.event_exceptions enable row level security;
alter table public.notes            enable row level security;
alter table public.note_folders     enable row level security;
alter table public.journal          enable row level security;
alter table public.pomodoro_logs    enable row level security;
alter table public.subjects         enable row level security;
alter table public.study_plan       enable row level security;

-- 3) Policies: a signed-in user can do anything with their own rows, nothing
--    with anyone else's. (The anon role gets no policies, so it sees nothing.)
drop policy if exists "own rows" on public.events;
create policy "own rows" on public.events
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "own rows" on public.note_folders;
create policy "own rows" on public.note_folders
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "own rows" on public.journal;
create policy "own rows" on public.journal
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "own rows" on public.pomodoro_logs;
create policy "own rows" on public.pomodoro_logs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "own rows" on public.subjects;
create policy "own rows" on public.subjects
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Child tables: also require that the parent row they point at is yours, so
-- nobody can attach rows to someone else's event, course or subject by id.
drop policy if exists "own rows" on public.event_exceptions;
create policy "own rows" on public.event_exceptions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.events e
      where e.id = parent_event_id and e.user_id = (select auth.uid())
    )
  );

drop policy if exists "own rows" on public.notes;
create policy "own rows" on public.notes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (
      folder_id is null
      or exists (
        select 1 from public.note_folders f
        where f.id = folder_id and f.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "own rows" on public.study_plan;
create policy "own rows" on public.study_plan
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (
      subject_id is null
      or exists (
        select 1 from public.subjects s
        where s.id = subject_id and s.user_id = (select auth.uid())
      )
    )
  );

-- 4) Privileges for the signed-in role (no-ops if already granted).
grant select, insert, update, delete on
  public.events, public.event_exceptions, public.notes, public.note_folders,
  public.journal, public.pomodoro_logs, public.subjects, public.study_plan
to authenticated;

-- The 'notes' storage bucket stays private with no policies: files are only
-- reachable through signed URLs that the API issues after checking ownership.
-- New uploads are stored under "<user_id>/<course_id>/..."; older files keep
-- their original paths and keep working.
