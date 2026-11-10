# Module 5 — Journal — Completion Notes

Status: **code complete, verified by type-check + lint + `next build` + helper tests.
Migration NOT yet applied** (the `luna-tracker` Supabase project is currently paused —
see "Before you deploy"). Files still need copying into the `luna-tracker` repo and a smoke
test on the live deploy.

## What got built

`/journal` — one page, two columns on desktop (stacked on mobile: composer → calendar → entries):

- **Composer** — date picker (can't pick a future date), mood chips, free-text body, a
  rotating daily writing prompt as the placeholder, character counter, Ctrl/⌘+Enter to save.
- **Mood calendar** — month grid with a pastel dot per day (colour of that day's mood),
  today ringed, future days disabled. Click a day to filter entries to it (and the composer
  date follows); click again to clear. Prev / next month and a "Today" jump.
- **Stat tiles** — day streak and total entries.
- **Entries list** — grouped by day ("Today", "Yesterday", then dates), newest first. Each
  card shows mood chip, time, "edited" marker, **edit in place** and **delete** (two-step
  inline confirm).
- **Search** — debounced text search across all entries, all time (capped at 100 results).

Files (copy to the same paths in the repo):

- `supabase/004_journal.sql`
- `lib/journal-types.ts`, `journal-moods.ts`, `journal-limits.ts`, `journal-dates.ts`,
  `journal-server.ts`, `journal-client.ts`
- `app/api/journal/route.ts` (replaces the 501 stub), `app/api/journal/[id]/route.ts`
- `components/journal/` — `journal-view`, `entry-form`, `entry-card`, `journal-calendar`,
  `mood-picker`
- `app/journal/page.tsx` (replaces the Module 1 placeholder)

API:
- `GET /api/journal?start=&end=` · `?q=` · `?stats=1&today=`
- `POST /api/journal` `{ date, mood?, body }`
- `PATCH/DELETE /api/journal/[id]`

## Decisions made along the way

**Open decision answered by default: multiple entries per day.** The base schema had no
unique constraint on `date`, and it's the lower-regret choice — switching to one-per-day
later means adding a unique index and merging duplicates, while the reverse is free. The UI
groups entries by day, so it reads fine either way. If you want one-per-day, say so and I'll
change the composer to edit-today's-entry instead of adding a new one.

**Moods are a fixed set of seven**, each mapped to one of the four pastel tag colours:
happy (yellow), calm (green), grateful (pink), focused (blue), tired (blue), stressed
(yellow), low (pink). Mood is optional. The set lives in `lib/journal-moods.ts` and is
enforced by a check constraint in the migration — keep the two in sync.

**Migration is additive.** Adds `updated_at`, makes `mood` nullable, adds the mood check
(`NOT VALID`, so it can't fail on stray legacy rows), and an index on `(date desc,
created_at desc)`.

**Streak matches the Dashboard's rule**: consecutive days ending today; 0 if today isn't
logged yet. The stats endpoint takes `today` from the browser so the user's local date is
used, not the server's UTC date.

**"Today" is hydration-safe** (`useSyncExternalStore`, empty on the server), since the
server clock (UTC) and the browser (IST) can disagree around midnight. The page shows a
skeleton for the first paint, then the real UI.

**No new dependencies** — `lucide-react` was already added in Module 2. Dates use local
`Date` fields, never `toISOString()`, same as Module 3. Delete confirm is inline rather
than reusing Module 4's modal, so Module 5 doesn't depend on Module 4's files being in the repo.

## Before you deploy

1. **The `luna-tracker` Supabase project is paused** (status `INACTIVE` — free-tier projects
   pause after inactivity). While it's paused the whole live app's data calls fail, not just
   Journal. Restore it from the Supabase dashboard (or ask me to), then apply
   `supabase/004_journal.sql` in the SQL editor.
2. Files are pushed to `main`; Vercel redeploys automatically.

## Known limitations

- Journal text isn't searchable across the first 1,000 entries for the streak/total stats
  (stats read the 1,000 most recent dates). Irrelevant at personal-journal volume.
- No rich text, tags beyond mood, or photo attachments.
- Moving an entry to another date is supported via edit; there is no drag-and-drop.

Tailwind tokens were checked against the real `globals.css` when pushing: headings use `font-display` (not `font-serif`), and the page wrapper has no padding of its own because the nav shell's `<main>` already pads. Text on pastel backgrounds uses the literal `#3D2B24`.

## Verified

- `tsc --noEmit`, `eslint`, and `next build` (Next.js 16) pass in a scratch project using a
  stub `lib/supabase.ts` with your real factory-function shape; `/journal`, `/api/journal`,
  `/api/journal/[id]` all resolve.
- Server helpers (date validation, streak maths incl. same-day duplicates and a missing
  today, input parsing) tested directly.
- **Not verified:** API routes against the live database (project paused), and the UI in a
  browser against your real theme. Smoke test on the deploy: save an entry with a mood →
  see it appear and the calendar dot show → click the day to filter → edit it → search for a
  word from it → delete it → check the streak tile.

## Suggested edit to `BUILD_SPEC.md`

Tick Module 5 in the progress tracker once the smoke test passes. Update the Module 5 build
bullets to: "entry form (date, optional mood, text), multiple entries per day, mood calendar,
edit/delete, search, streak". Also update `lib/build-progress.ts` (Module 2's widget) to
show 4 of 8 built (Modules 1, 3, 4, 5 — plus 2).

## Prompt to resume where this left off

Module 5 (Journal) is code-complete and build-verified. Restore the paused Supabase project,
apply `004_journal.sql`, copy the files into the repo, deploy, and run the smoke test above.
Next: Module 6 (Pomodoro) — it has an open decision about linking sessions to Study subjects.
