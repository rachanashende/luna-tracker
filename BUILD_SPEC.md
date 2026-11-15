# Personal Daily Tracker — Build Spec

This doc is the single source of truth for the project. It's split into modules — when you're ready to build a specific module, start a new chat and paste in the "Prompt to start this module" line from that section along with this file. Each module lists what it depends on, so build them roughly in order.

Check off `[ ]` → `[x]` as modules get finished so it's easy to see progress at a glance.

---

## 0. Global reference (needed in every module)

### Tech stack
- **Frontend + backend**: Next.js (App Router, TypeScript)
- **Database + file storage**: Supabase (Postgres + Storage)
- **AI**: Gemini API (`gemini-2.5-flash` or `flash-lite`), free tier, key from aistudio.google.com
- **Styling**: Tailwind CSS
- **Hosting**: Cloudflare Workers (app, free plan) + Supabase (DB/storage). *Migrating from Vercel as of Nov 2026 — see "Hosting migration" below.*
- **Auth**: multi-user — Supabase Auth (email + password, cookie sessions via `@supabase/ssr`), sign-up gated by an invite code (`INVITE_CODE` secret), per-user data isolation with `user_id` + Postgres RLS (see "Multi-user" below)

### Multi-user (added Nov 2026)

- Supabase Auth, email + password; `/signup` requires `INVITE_CODE` (Worker secret, compared in constant time; sign-up is closed if unset).
- `supabase/005_multi_user.sql`: `user_id uuid default auth.uid()` on events, event_exceptions, notes, note_folders, journal, pomodoro_logs, subjects, study_plan, with RLS "own rows" policies (child tables also check the parent row's owner). Tested locally on Postgres: other users can't read, update, delete, insert as, or attach to someone else's rows; anon sees nothing.
- `supabase/006_claim_existing_data.sql`: one-time script assigning pre-existing rows to the owner's account.
- API routes and the dashboard use the per-request, RLS-bound Supabase client (`lib/supabase-server.ts`). The service-role client is used only to sign storage URLs after ownership is verified. New upload paths are `<userId>/<folderId>/<uuid>-<name>`.
- Setup: apply 005, turn off "Confirm email" in Supabase, sign up, run 006 with your email.
- **Known limitations:** dashboard "today" is fixed to `Asia/Kolkata`; invite-code guesses aren't rate-limited; Workers Free 10 ms CPU limit; `NEXT_PUBLIC_*` must be Cloudflare build variables.

### Hosting migration: Vercel → Cloudflare Workers (started Nov 2026)

**Status:** code migration done and tested locally (vinext build passes; the built Worker redirects signed-out requests to `/login`). **Not yet deployed to Cloudflare** — remaining: first deploy, env vars, and the checklist below. (Vercel project has been deleted, so the app is offline until this is deployed.)

**Approach:** use **vinext**, which Cloudflare now recommends as the default way to run Next.js on Workers. `npx vinext check` on this repo reports 100% compatible (including `proxy.ts`). The OpenNext adapter (`@opennextjs/cloudflare`) is the fallback, but its docs say Node.js middleware isn't supported yet, which Next.js 16's `proxy.ts` is likely to hit.

**Steps:**
1. ~~Bump `react` and `react-dom` to 19.3.1~~ — done (vinext requires `^19.3.1`; the repo was on 19.2.8).
2. ~~Run `npx vinext init --platform cloudflare`~~ — done with no CDN cache, no data cache, and no image optimization (Luna is single-user and doesn't use `next/image`). Added `vite.config.ts`, `cloudflare.config.ts`, the `*:vinext` scripts, and `"type": "module"`.
3. ~~Test locally~~ — `npm run build:vinext` passes; `npm run start:vinext` serves the Worker and `proxy.ts` redirects work.
4. Deploy with `npm run deploy:vinext` (builds, then deploys; asks you to sign in to Cloudflare). Auto-deploy from GitHub can be connected afterwards.
5. Set env vars in Cloudflare: `INVITE_CODE` (secret), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and (Module 7) `GEMINI_API_KEY`. `NEXT_PUBLIC_` vars must also be build variables.
6. Run the checklist below against the new `*.workers.dev` URL, then update the live URLs in the docs and delete the Vercel project.

**Workers Free limits to watch:** 100,000 requests/day; **10 ms CPU time per request** (waiting on Supabase/Gemini doesn't count); 50 subrequests per invocation; 128 MB memory. The CPU cap is the main risk for server-rendered pages (Dashboard, Calendar's `lib/recurrence.ts`, Journal stats) and for server-side PDF parsing in Module 7.

**Verification checklist:**
- [ ] Signed out, `/` and `/dashboard` redirect to `/login?from=…` (tests `proxy.ts`)
- [ ] Login and logout work
- [ ] Dashboard loads with live data, no CPU-limit errors
- [ ] Calendar: add/edit/delete, recurring events
- [ ] Notes: create a course, upload a PDF direct to Supabase, open and download it
- [ ] Journal: save an entry, see it in the calendar and list
- [ ] Theme toggle persists, no flash of wrong theme

**Not affected by the move:** Supabase (DB, storage, RLS, migrations), and the browser → Supabase direct-upload flow for notes.

### Color palette (finalized)

**Light mode**
| Role | Hex |
|---|---|
| Background | `#FDF6F0` (vanilla) |
| Accent | `#F7C8D2` (baby pink) |
| Highlight | `#FBE7B2` (pale yellow) |
| Text | `#5A3E36` (espresso) |
| Headings | `#3D2B24` (dark espresso) |

**Dark mode**
| Role | Hex |
|---|---|
| Background | `#2A1E1A` (deep espresso) |
| Cards | `#3D2B24` |
| Accent | `#F7C8D2` (baby pink) |
| Secondary accent | `#A9CDE8` (baby blue) |
| Text | `#F2E9E4` |

**Category tag pastels** (subjects, moods, event types): green `#AEE1D6`, blue `#B8D4F0`, yellow `#FBE7B2`, pink `#F7C8D2`

### Folder structure
```
/app
  /dashboard  /calendar  /notes  /journal  /pomodoro  /study  /login
  /api
    /events  /notes  /journal  /pomodoro  /study-plan
/lib
  supabase.ts   gemini.ts
/components
```

### Base DB schema (will grow per module)
```
events        (id, title, date, start_time, end_time, notes, created_at)
notes         (id, title, body, created_at, updated_at)
journal       (id, date, mood, body, created_at)
pomodoro_logs (id, subject, duration_min, started_at)
subjects      (id, name, confidence, exam_date, target_grade, syllabus_text)
study_plan    (id, subject_id, date, topic, status, source)
```

### Accounts needed before starting
- [ ] Supabase account + project created
- [ ] Gemini API key (aistudio.google.com/app/apikey)
- [ ] Cloudflare account (Workers, free plan) — replaces the Vercel account; needed for the hosting migration
- [x] ~~Vercel account~~ — original host, being retired after the Cloudflare cutover
- [ ] Password chosen for the login gate

---

## Module 1 — Foundation
**Status:** [x] done

**Goal:** Working, deployed, password-locked shell with theme applied. Nothing functional yet beyond navigation.

**Depends on:** nothing (start here)

**Build:**
- Next.js project scaffolded, Tailwind configured with the palette above (light + dark mode)
- Supabase project connected, base schema (section 0) migrated
- `/login` page (email + password) and `/signup` page (invite code + email + password) via Supabase Auth; superseded the original shared-password gate
- `proxy.ts` refreshing the Supabase session and redirecting unauthenticated requests to `/login`
- App shell: sidebar/top nav with links to Dashboard, Calendar, Notes, Journal, Pomodoro, Study
- Dark/light mode toggle
- Deployed (first to Vercel, env vars set: Supabase URL/key, session secret; now migrating to Cloudflare Workers — see "Hosting migration")

**Definition of done:** You can visit the live URL, get redirected to login, sign in, and land on an empty dashboard shell with working nav and theme toggle.

**Prompt to start this module in a new chat:**
> "I'm building Module 1 (Foundation) of my personal daily tracker. Here's the build spec: [paste this file]. Let's scaffold the Next.js + Supabase project, set up the password gate, and apply the color palette."

---

## Module 2 — Dashboard
**Status:** [ ] not started

**Depends on:** Module 1

**Build:**
- Overview cards: today's date, today's events (pulled from `events` table once Module 3 exists — placeholder until then), quick stats
- Layout that other modules' data will plug into later (revisit after Modules 3–6 are built to wire in real data)

**Definition of done:** Dashboard renders with placeholder/live cards and matches the theme.

**Prompt to start this module in a new chat:**
> "I'm building Module 2 (Dashboard) of my personal daily tracker. Here's the build spec: [paste this file]. Module 1 (foundation/auth/shell) is done. Let's build the dashboard overview page."

---

## Module 3 — Calendar
**Status:** [ ] not started

**Depends on:** Module 1

**Open decision (answer before/at start of this module):** Do you want recurring events (e.g. "gym every Mon/Wed/Fri"), or just one-off events for now?

**Build:**
- Month and week views
- Add/edit/delete event (title, date, start/end time, notes)
- Uses the `events` table from section 0 (add `recurrence_rule` column if recurring events are wanted)

**Definition of done:** You can add, edit, and delete events from a calendar view, and they persist.

**Prompt to start this module in a new chat:**
> "I'm building Module 3 (Calendar) of my personal daily tracker. Here's the build spec: [paste this file]. Module 1 is done. My answer on recurring events is: [answer]. Let's build the calendar."

---

## Module 4 — Notes
**Status:** [ ] not started

**Depends on:** Module 1

**Build:**
- List view of notes, create/edit/delete
- Simple text search across title + body
- Uses the `notes` table from section 0

**Definition of done:** You can create, edit, delete, and search notes, and they persist.

**Prompt to start this module in a new chat:**
> "I'm building Module 4 (Notes) of my personal daily tracker. Here's the build spec: [paste this file]. Module 1 is done. Let's build the notes section."

---

## Module 5 — Journal
**Status:** [ ] not started

**Depends on:** Module 1

**Open decision (answer before/at start of this module):** One entry per day max, or multiple entries per day allowed?

**Build:**
- Entry form: date, mood tag (using the pastel category colors), free text
- Past entries list/calendar view
- Uses the `journal` table from section 0

**Definition of done:** You can log a journal entry with mood + text, and browse past entries.

**Prompt to start this module in a new chat:**
> "I'm building Module 5 (Journal) of my personal daily tracker. Here's the build spec: [paste this file]. Module 1 is done. My answer on entries-per-day is: [answer]. Let's build the journal."

---

## Module 6 — Pomodoro
**Status:** [ ] not started

**Depends on:** Module 1 (and Module 7 if you want subject-linking from the start)

**Open decision (answer before/at start of this module):** Should sessions link to a subject from the study tracker (Module 7), or stay freeform ("what are you working on" as free text)?

**Build:**
- Configurable work/break timer
- Session log (subject or freeform label, duration, timestamp) saved to `pomodoro_logs`
- Daily focus-time stat (feeds into Dashboard later)

**Definition of done:** You can run a Pomodoro session and see it logged with duration and label.

**Prompt to start this module in a new chat:**
> "I'm building Module 6 (Pomodoro) of my personal daily tracker. Here's the build spec: [paste this file]. Module 1 is done. My answer on subject-linking is: [answer]. Let's build the Pomodoro timer."

---

## Module 7 — Study Tracker + AI Study Planner
**Status:** [ ] not started

**Depends on:** Module 1 (Module 3/Calendar recommended first, so generated study blocks can sync to it)

**Build:**
- Subject entry: name, confidence rating (1–5), exam date, target grade
- Syllabus input: type directly OR upload a PDF (parsed server-side to text)
- Server-side call to Gemini API (key never exposed to browser) with syllabus text + confidence + exam date + target grade → returns a day-by-day study plan
- Editable generated plan, stored in `study_plan` table
- Progress tracking: check off completed topics/sessions, per-subject progress bar
- Optional: auto-add study blocks as calendar events

**Definition of done:** You can add a subject with a syllabus, generate an AI study plan, edit it, and check off progress.

**Prompt to start this module in a new chat:**
> "I'm building Module 7 (Study Tracker + AI Study Planner) of my personal daily tracker. Here's the build spec: [paste this file]. Modules 1 and 3 are done. Let's build the syllabus upload, AI plan generation via Gemini, and progress tracking."

---

## Module 8 — Polish & wiring
**Status:** [ ] not started

**Depends on:** all previous modules

**Build:**
- Wire real data into the Dashboard (today's events, recent notes, journal streak, focus time, study progress)
- Mobile responsiveness pass
- Optional: data export (download notes/journal as backup)
- Final deploy check

**Definition of done:** Dashboard shows live data from every module, app works well on mobile, deployed and stable.

**Prompt to start this module in a new chat:**
> "I'm building Module 8 (Polish) of my personal daily tracker — the final pass. Here's the build spec: [paste this file]. All other modules are done. Let's wire the dashboard to live data and do a mobile/polish pass."

---

## Progress tracker

- [x] Module 1 — Foundation
- [ ] Module 2 — Dashboard
- [ ] Module 3 — Calendar
- [ ] Module 4 — Notes
- [ ] Module 5 — Journal
- [ ] Module 6 — Pomodoro
- [ ] Module 7 — Study Tracker + AI Planner
- [ ] Module 8 — Polish & wiring
