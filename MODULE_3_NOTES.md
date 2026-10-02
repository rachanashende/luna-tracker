# Module 3 — Calendar — Completion Notes

Status: **code complete, verified by build + tests, migration applied to the live
Supabase project.** The app code itself (`lib/`, `components/`, `app/`) is not yet
dropped into the `luna-tracker` repo — this session hasn't been linked to a folder
containing it — see "How to install" below.

This doc is a record of what got built and the calls made along the way, in the
same spirit as `MODULE_1_NOTES.md`.

## What got built

- **Recurrence model**: rather than materializing rows for every future occurrence,
  a recurring event is one "master" row in `events` (with `recurrence_days` +
  `recurrence_end_date`), expanded into concrete occurrences at request time. A new
  `event_exceptions` table holds per-occurrence overrides or cancellations, which is
  what makes "edit this event" vs. "edit all events in the series" possible without
  duplicating data.
- `supabase/002_calendar_recurrence.sql` — migration: adds `recurrence_days`
  (`smallint[]`, 0=Sun..6=Sat) and `recurrence_end_date` to `events`; creates
  `event_exceptions`.
- `lib/events-types.ts` — shared types for DB rows, expanded occurrences, and the
  API request/response shapes.
- `lib/dates.ts` — local-date helpers (month grid, week days, formatting). Everything
  works off local `Date` fields, never `toISOString()`/UTC — that would shift dates
  across midnight for anyone west of UTC.
- `lib/recurrence.ts` — `expandEventOccurrences()` / `expandAllEvents()`: turns
  `events` + `event_exceptions` rows into a flat, sorted list of occurrences for a
  date range. Covered by `scripts/test-recurrence.ts` (11 cases — one-off in/out of
  range, weekday matching, end-date cutoff, anchor-date floor, cancellation,
  per-occurrence override, multi-event sort).
- `app/api/events/route.ts` — `GET` (list occurrences for `?start=&end=`), `POST`
  (create one-off or recurring event).
- `app/api/events/[id]/route.ts` — `PATCH` and `DELETE`, both scoped by
  `occurrence_date` + `scope: "this" | "all"`.
- `components/calendar/` — `calendar-view.tsx` (state, fetching, header/nav),
  `month-grid.tsx`, `week-grid.tsx`, `event-pill.tsx`, `event-dialog.tsx` (create/edit
  form with the weekday picker and the this/all scope choice).
- `app/calendar/page.tsx` — replaces the Module 1 placeholder.

## Decisions made along the way

**Recurrence storage: rule + exceptions, not materialized rows.** The alternative —
writing one row per occurrence when a recurring event is created — makes "repeat with
no end date" awkward (how far do you generate?) and complicates moving the whole
series later. The rule-plus-exceptions model is what Google Calendar and similar
apps use under the hood, and it maps cleanly onto "edit this / edit all."

**Known limitation: "this event only" can't move that occurrence's date.** An
exception row is keyed by `(parent_event_id, occurrence_date)`, so overriding the
date would mean the client no longer knows which occurrence it's talking about.
Editing title/time/notes for a single occurrence works fine; if you want to reschedule
just one occurrence of a recurring series to a different day, delete that one
occurrence (scope "this") and add a separate one-off event. Flagging this rather than
building full per-occurrence rescheduling, since it adds real complexity for a case
the build spec didn't ask for.

**Week view is agenda-style, not an hourly grid.** `BUILD_SPEC.md` says "week view"
without specifying an hourly time-grid, so this is an interpretation call: each day is
a column listing its events in time order, consistent with the month view's pill
style. An hourly grid is a reasonable follow-up if you want to see gaps between
events at a glance — flagging it as a possible v2, not building it now.

**No new UI dependency.** `BUILD_SPEC.md` names only Tailwind CSS for styling — no
component library is mentioned as installed. The event dialog is a hand-built modal
(fixed overlay + panel, Escape-to-close) rather than pulling in Radix or similar.

## Assumption you need to verify against the real repo

I don't have `lib/supabase.ts`'s actual contents — Module 1's notes describe "a
browser client and a server-only service client" but not the exact export names.
Both API route files import a service-role client as:

```ts
import { supabaseAdmin } from "@/lib/supabase";
```

If your real export is named differently (e.g. `createServiceClient()`), that's a
one-line fix in `app/api/events/route.ts` and `app/api/events/[id]/route.ts` — nothing
else depends on the name.

I also used four Tailwind utility classes that Module 1's notes confirm exist
(`bg-background`, `text-heading`-style tokens, `bg-accent`, `bg-tag-green` /
`bg-tag-blue` / `bg-tag-yellow` / `bg-tag-pink`), plus a few I inferred but couldn't
verify against your actual `globals.css` (`bg-surface`, `border-border`,
`font-serif` for the Fraunces heading font). If any of those don't exist as tokens
in your theme, the affected elements will just fall back to unstyled/default —
nothing breaks, but check `app/calendar` after dropping the files in and adjust
class names to match your real token set if things look off. Anywhere I needed
guaranteed contrast on the pastel tag colors (which BUILD_SPEC says are identical
in light/dark mode), I used the literal hex `#3D2B24` inline instead of a guessed
token, so that part won't drift regardless.

## How to install this into `luna-tracker`

This session wasn't linked to a folder containing the repo, so the files are
delivered separately rather than committed directly. To install:

1. ~~Run `supabase/002_calendar_recurrence.sql` in the Supabase SQL editor~~ — **done.**
   Applied directly to the live `luna-tracker` Supabase project (2026-10-02) via the
   Supabase MCP tools once the project came back online from its pause. Verified:
   `events` now has `recurrence_days`/`recurrence_end_date`, `event_exceptions`
   exists with the FK to `events`, and the security advisor shows it with the same
   "RLS enabled, no policy" status as your six existing tables — not a gap, just
   consistent with how every other table here relies on the service-role client.
   The `.sql` file is kept in this bundle for the repo's own migration history, not
   because it still needs running.
2. Copy `lib/events-types.ts`, `lib/dates.ts`, `lib/recurrence.ts` into your `lib/`.
3. Copy `components/calendar/*` into your `components/calendar/`.
4. Replace `app/calendar/page.tsx` with the one here.
5. Replace the stub `app/api/events/route.ts` and add
   `app/api/events/[id]/route.ts`.
6. Check the `supabaseAdmin` import in both API route files against your real
   `lib/supabase.ts` export name (see above) — **still unverified**, this session
   hasn't been linked to a folder with the repo in it yet.
7. `npm run build` locally to confirm it compiles against your real
   `lib/supabase.ts` and theme tokens, then deploy as usual.

## Verified

- `npx tsc` / `next build` (Next.js 16.3.5, matching the live app) compile and
  type-check clean against a scratch project scaffolded the same way as the real
  repo (App Router + TS + Tailwind v4), with a stub `lib/supabase.ts` standing in
  for the real one.
- All API routes and the `/calendar` page resolve correctly in the build's route
  list (`/api/events`, `/api/events/[id]`, `/calendar`).
- `scripts/test-recurrence.ts` — 11/11 passing — covers one-off events, weekday
  recurrence expansion, end-date cutoff, the anchor-date floor, cancelled
  occurrences, per-occurrence field overrides, and multi-event date/time sorting.
- The migration itself ran clean against the live `luna-tracker` Supabase project:
  `events.recurrence_days`/`recurrence_end_date` added, `event_exceptions` created
  with its FK and unique constraint, and the security advisor confirms its RLS
  status matches the other six tables exactly.
- Not verified: the app code against the live DB end-to-end (no deployed app build
  with these routes yet), the `supabaseAdmin` export-name assumption, and no
  visual/browser check of the calendar UI against your real theme tokens — do a
  local `npm run dev` pass after installing to catch any token-name mismatches.

## Prompt to resume where this left off

Module 3's code is complete and verified by build + unit tests, and its DB migration
is already live on Supabase. What's left is purely mechanical: drop the files into
`luna-tracker` (step 2 onward in "How to install"), fix the `supabaseAdmin` import if
it doesn't match your real `lib/supabase.ts`, run `npm run build` locally, and deploy.
Once that's confirmed working, mark Module 3 done in `BUILD_SPEC.md`'s progress
tracker. Next up per the spec is Module 4 (Notes), which only depends on Module 1.
