# Luna

A personal, password-locked productivity hub: calendar, notes, journal,
Pomodoro timer, and an AI-assisted study planner. See `PROJECT_PLAN.md` (if
you have your original copy) and `BUILD_SPEC.md` for the full plan —
`BUILD_SPEC.md` and `FILE_STRUCTURE.md` are the ones that matter for
building each module, and both live in this repo so they travel with the
code. (These planning docs still refer to the project as "daily tracker"
internally — that's just the working title from planning; the app itself
is branded Luna.)

This repo currently has **Module 1 (Foundation)** built. Everything else is
a placeholder page or a `501` API stub with a `TODO(Module N — ...)` comment
telling you which module fills it in — open `BUILD_SPEC.md` for that
module's full prompt when you're ready.

## What Module 1 gives you

- Next.js (App Router, TypeScript) + Tailwind, with the finalized color
  palette wired up for light and dark mode
- A dark/light theme toggle (persisted, no flash on load)
- A single-password login gate: password → server-side check → signed,
  httpOnly session cookie (no user accounts)
- Middleware that redirects anyone without a valid session to `/login`
- The app shell: sidebar nav on desktop, bottom tab bar on mobile, with
  links to all six sections
- Supabase client helpers (`lib/supabase.ts`) — a browser client and a
  server-only service-role client
- `supabase/schema.sql` — the base tables every later module builds on

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/schema.sql` from this repo. That
   creates `events`, `notes`, `journal`, `pomodoro_logs`, `subjects`, and
   `study_plan` with RLS enabled (locked down — all access goes through
   this app's API routes using the service-role key, not directly from the
   browser).
3. Go to **Project Settings → API** and grab:
   - Project URL
   - `anon` public key
   - `service_role` key (keep this one secret)

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (secret) |
| `APP_PASSWORD` | Any password you want — this is the single shared login |
| `SESSION_SECRET` | A random string, e.g. `openssl rand -base64 32` |
| `GEMINI_API_KEY` | Not needed until Module 7 — [aistudio.google.com](https://aistudio.google.com/app/apikey) |

## 3. Run it locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — you should land on `/login`, and after
entering `APP_PASSWORD` you'll be redirected to `/dashboard` inside the app
shell with working nav and theme toggle.

## 4. Deploy to Cloudflare Workers

Luna runs on Cloudflare Workers (free plan) using [vinext](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/),
Cloudflare's recommended way to run Next.js on Workers. (It was originally
hosted on Vercel; see "Hosting migration" in `BUILD_SPEC.md`.)

1. Push this repo to GitHub.
2. One-time setup: run `npx vinext init --platform cloudflare`. It adds the
   vinext/Vite dependencies, the `dev:vinext` / `build:vinext` scripts, and the
   Workers config. Note that vinext needs React 19.3.1 or newer.
3. In the [Cloudflare dashboard](https://dash.cloudflare.com/), connect this
   GitHub repo (Workers & Pages → Create), or deploy from the terminal with
   `npx @vinext/cloudflare deploy`.
4. Add the same variables from `.env.local` under **Settings → Variables and
   Secrets**. Put the secrets (`SUPABASE_SERVICE_ROLE_KEY`, `APP_PASSWORD`,
   `SESSION_SECRET`, `GEMINI_API_KEY`) in as secrets, and add the
   `NEXT_PUBLIC_` ones as **build variables** too, since they're needed at
   build time. For local Workers dev, put them in a `.dev.vars` file (gitignored).
5. Deploy. Visit the `*.workers.dev` URL — same behavior as local: redirected
   to `/login` until you enter the password.

Workers Free limits worth knowing: 100,000 requests/day and 10 ms CPU time per
request (time spent waiting on Supabase or Gemini doesn't count).

## Building the next module

Each module in `BUILD_SPEC.md` has a ready-to-paste prompt under "Prompt to
start this module in a new chat." Start a **fresh chat**, paste that prompt
plus this repo's `BUILD_SPEC.md`, and mention which prior modules are done.
Three decisions are intentionally deferred to their module's chat (recurring
events, subject-linked Pomodoro sessions, journal entries-per-day) — have
your answer ready when you start that module.

Progress is tracked at the bottom of `BUILD_SPEC.md` — check off each module
as it's finished so it's easy to see at a glance what's left.
