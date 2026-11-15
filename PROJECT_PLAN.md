# Personal Daily Tracker — Project Plan

**Status:** Draft for review — nothing built yet. Confirm this, then we start Phase 1.

## 1. What this is

A personal, single-user full-stack web app, deployed on a real URL, password-gated. It combines a daily dashboard, calendar, notes, journal, Pomodoro timer, and an AI-powered study planner (syllabus → confidence rating → exam date/target grade → generated study schedule).

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + Backend | **Next.js** (App Router, TypeScript) | One codebase, API routes double as backend, runs on Cloudflare Workers (originally planned for Vercel) |
| Database + Auth storage + File storage | **Supabase** (Postgres + Storage) | Free tier, generous for single-user, gives you a real Postgres DB and file storage for uploaded syllabus PDFs |
| AI (study plan generation) | **Gemini API** (`gemini-2.5-flash` or `flash-lite`), via free API key from Google AI Studio | Free tier (no card needed), plenty of headroom for personal use — you'll generate maybe a handful of plans a week, nowhere near the daily request cap |
| Styling | **Tailwind CSS** | Fast to theme once we pick your color palette |
| Hosting | **Cloudflare Workers** (app, via vinext) + **Supabase** (DB/storage) | Both have permanent free tiers sufficient for one user |
| Auth | **Single shared password** (not full user accounts) | It's just you — a password gate (env-var secret, checked server-side, sets an httpOnly session cookie) is simpler than real auth and still keeps strangers out |

## 3. Feature breakdown by phase

We build in phases so it's usable early and nothing feels overwhelming.

### Phase 1 — Foundation
- Password gate (login screen → session cookie)
- App shell: sidebar/nav, responsive layout, theme (colors TBD)
- Dashboard page (skeleton): today's date, quick overview cards (placeholder data)
- Supabase project wired up, base schema deployed

### Phase 2 — Core planner
- **Calendar**: month/week view, add/edit/delete events quickly (title, time, date, optional notes)
- **Notes**: freeform notes list, create/edit/delete, simple search
- **Dashboard (real)**: today's events, top 3 notes/tasks, streaks, quick stats

### Phase 3 — Journal + Pomodoro
- **Journal**: one entry per day, mood tag, free text, past-entries list/calendar view
- **Pomodoro**: configurable work/break intervals, session log tied to a subject/task, daily focus-time stat on dashboard

### Phase 4 — Study Tracker + AI Study Planner (the "tasku.ai"-style feature)
- **Syllabus input**: type it in OR upload a PDF (parsed via `pdf-parse` or similar, extracted to text)
- Per subject: confidence rating (1–5 or 1–10), exam date, target grade
- **Gemini-generated schedule**: sends syllabus text + confidence + exam date + target grade to Gemini, gets back a day-by-day study plan, stored in DB, editable by you
- **Study tracker**: check off completed study sessions/topics, progress bar per subject, syncs with calendar (auto-adds study blocks as events)

### Phase 5 — Polish
- Color theme finalized and applied everywhere
- Mobile responsiveness pass
- Data export (optional: download your notes/journal as backup)

## 4. Rough database schema (Supabase/Postgres)

```
events        (id, title, date, start_time, end_time, notes, created_at)
notes         (id, title, body, created_at, updated_at)
journal       (id, date, mood, body, created_at)
pomodoro_logs (id, subject, duration_min, started_at)
subjects      (id, name, confidence, exam_date, target_grade, syllabus_text)
study_plan    (id, subject_id, date, topic, status, source: 'ai'|'manual')
```
(This will evolve — just enough to start.)

## 5. Folder structure (once we start coding)

```
/app
  /dashboard
  /calendar
  /notes
  /journal
  /pomodoro
  /study         → subjects, syllabus upload, AI plan, tracker
  /api
    /events
    /notes
    /journal
    /study-plan  → Gemini call happens server-side here (key never exposed to browser)
  /login
/lib
  supabase.ts
  gemini.ts
/components
```

## 6. What you'll need to provide before Phase 1 starts

- A Supabase account (free) — I'll walk you through creating the project
- A Gemini API key from [aistudio.google.com](https://aistudio.google.com/app/apikey) (free, no card, ~1 minute) — I'll walk you through this too
- A Cloudflare account (free) for deployment
- Your chosen color palette (send me the options you're considering)
- The password you want for the login gate

## 7. Open questions for you

1. Should Pomodoro sessions be tied to a specific subject (from the study tracker) or freeform ("what are you working on")?
2. For the calendar — do you want recurring events (e.g. "gym every Mon/Wed/Fri"), or just one-off events for now?
3. Journal: one entry per day max, or multiple entries per day allowed?

---
*Next step: you review this, send the color options, answer the open questions above — then we start Phase 1.*
