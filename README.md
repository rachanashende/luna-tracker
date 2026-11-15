# Luna

A productivity hub with private per-user accounts: calendar, notes, journal,
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
- Multi-user accounts: Supabase Auth (email + password), sign-up gated by an
  invite code, cookie sessions refreshed in `proxy.ts`
- Every table has a `user_id` and Postgres row-level security, so each person
  only ever sees their own data
- `proxy.ts` redirects anyone without a valid session to `/login`
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
| `INVITE_CODE` | Any code you choose — friends must enter it on `/signup` |
| `GEMINI_API_KEY` | Not needed until Module 7 — [aistudio.google.com](https://aistudio.google.com/app/apikey) |

## 3. Run it locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — you should land on `/login`, and after
signing up (with `INVITE_CODE`) or logging in you'll be redirected to
`/dashboard` inside the app shell with working nav and theme toggle.

## 3b. Multi-user setup (Supabase)

1. In the Supabase SQL editor, run `supabase/005_multi_user.sql` (adds `user_id`
   + row-level security to every table).
2. Authentication → Providers → Email: turn **off** "Confirm email" (the invite
   code already gates sign-up, and Supabase's default mailer is heavily rate-limited).
3. Sign up in the app at `/signup` with your invite code.
4. Run `supabase/006_claim_existing_data.sql` after replacing `YOUR_EMAIL_HERE`
   with your sign-up email. This assigns all pre-existing rows to you. Until it
   runs, old data is invisible to everyone.
5. Friends sign up the same way with the invite code. Their data is fully separate.

Known limitations: the dashboard's "today" is fixed to `Asia/Kolkata`;
invite-code guesses are not rate-limited; uploaded files from before multi-user
keep their old storage paths (they still work).

## 4. Deploy to Cloudflare Workers

Luna runs on Cloudflare Workers (free plan) using [vinext](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/),
Cloudflare's recommended way to run Next.js on Workers. (It was originally
hosted on Vercel; see "Hosting migration" in `BUILD_SPEC.md`.)

1. Push this repo to GitHub.
2. The vinext setup is already done in this repo (`vite.config.ts`,
   `cloudflare.config.ts`, and the `*:vinext` scripts; React is 19.3.1 as vinext
   requires). Test locally with `npm run build:vinext` then `npm run start:vinext`.
3. Deploy from your terminal with `npm run deploy:vinext` (builds, then deploys to
   Cloudflare Workers; you'll be asked to sign in to Cloudflare the first time).
   You can connect the GitHub repo in the Cloudflare dashboard for auto-deploys
   later.
4. Add the same variables from `.env.local` under **Settings → Variables and
   Secrets**. Put the secrets (`SUPABASE_SERVICE_ROLE_KEY`, `INVITE_CODE`,
   `GEMINI_API_KEY`) in as secrets, and add the
   `NEXT_PUBLIC_` ones as **build variables** too, since they're needed at
   build time. For local Workers dev, put them in a `.dev.vars` file (gitignored).
5. Deploy. Visit the `*.workers.dev` URL — same behavior as local: redirected
   to `/login` until you sign in.

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
