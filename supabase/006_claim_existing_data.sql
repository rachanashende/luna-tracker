-- Module 9 — Claim your existing data.
--
-- Run this ONCE, after (1) running 005_multi_user.sql and (2) creating your own
-- account in the app. It attaches every existing row that has no owner yet to
-- your account, so your old events, courses, notes and journal show up for you
-- (and only you).
--
-- Replace the email below with the one you signed up with, then run it in the
-- Supabase SQL editor.

do $$
declare
  owner_email text := 'YOUR_EMAIL_HERE';   -- <-- change this
  owner_id uuid;
begin
  select id into owner_id from auth.users where lower(email) = lower(owner_email);

  if owner_id is null then
    raise exception 'No account found for %. Sign up in the app first, then re-run.', owner_email;
  end if;

  update public.events           set user_id = owner_id where user_id is null;
  update public.event_exceptions set user_id = owner_id where user_id is null;
  update public.note_folders     set user_id = owner_id where user_id is null;
  update public.notes            set user_id = owner_id where user_id is null;
  update public.journal          set user_id = owner_id where user_id is null;
  update public.pomodoro_logs    set user_id = owner_id where user_id is null;
  update public.subjects         set user_id = owner_id where user_id is null;
  update public.study_plan       set user_id = owner_id where user_id is null;
end $$;

-- Check: every table should show 0 unowned rows.
select 'events' as t, count(*) from public.events where user_id is null
union all select 'event_exceptions', count(*) from public.event_exceptions where user_id is null
union all select 'note_folders',     count(*) from public.note_folders     where user_id is null
union all select 'notes',            count(*) from public.notes            where user_id is null
union all select 'journal',          count(*) from public.journal          where user_id is null
union all select 'pomodoro_logs',    count(*) from public.pomodoro_logs    where user_id is null
union all select 'subjects',         count(*) from public.subjects         where user_id is null
union all select 'study_plan',       count(*) from public.study_plan       where user_id is null;
