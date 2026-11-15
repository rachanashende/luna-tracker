# File structure — Daily Tracker

This matches the `daily-tracker-skeleton.zip` folder exactly. Each entry notes which module owns it (see `BUILD_SPEC.md` for details on each module).

```
daily-tracker/
├── .env.example                  # env vars needed (Supabase, Gemini, invite code)
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts            # Module 1 — palette gets mapped in here
├── README.md
├── PROJECT_PLAN.md               # original project plan
├── proxy.ts                      # multi-user — session refresh + auth redirects
├── supabase/                     # schema.sql, 002–004 module migrations, 005_multi_user.sql, 006_claim_existing_data.sql
├── BUILD_SPEC.md                 # module-by-module build spec
│
├── app/
│   ├── layout.tsx                # Module 1 — root layout, nav shell, theme provider
│   ├── page.tsx                  # Module 1 — redirects to /dashboard or /login
│   ├── globals.css               # Module 1 — Tailwind + color palette variables
│   │
│   ├── login/
│   │   ├── page.tsx              # Module 1 — email + password login
│   │   ├── login-form.tsx
│   │   └── actions.ts            # login / signup / logout server actions
│   ├── signup/
│   │   ├── page.tsx              # invite-code sign-up
│   │   └── signup-form.tsx
│   │
│   ├── dashboard/
│   │   └── page.tsx              # Module 2 — overview cards
│   │
│   ├── calendar/
│   │   └── page.tsx              # Module 3 — month/week view, event CRUD
│   │
│   ├── notes/
│   │   └── page.tsx              # Module 4 — notes list, create/edit/delete, search
│   │
│   ├── journal/
│   │   └── page.tsx              # Module 5 — daily entry form, past entries
│   │
│   ├── pomodoro/
│   │   └── page.tsx              # Module 6 — timer, session log
│   │
│   ├── study/
│   │   └── page.tsx              # Module 7 — subjects, syllabus upload, AI plan, progress
│   │
│   └── api/
│       ├── events/route.ts       # Module 3 — CRUD for `events` table
│       ├── notes/route.ts        # Module 4 — CRUD for `notes` table
│       ├── journal/route.ts      # Module 5 — CRUD for `journal` table
│       ├── pomodoro/route.ts     # Module 6 — log sessions to `pomodoro_logs`
│       └── study-plan/route.ts   # Module 7 — parses syllabus, calls Gemini, saves plan
│
├── lib/
│   ├── supabase.ts                # Module 1 — Supabase browser client
│   ├── supabase-server.ts         # multi-user — per-request RLS-bound server client, auth helpers
│   └── gemini.ts                  # Module 7 — server-side Gemini API helper
│
├── components/
│   └── .gitkeep                   # shared UI components go here as modules are built
│
└── public/                        # static assets
```

## Notes
- Every page/route file in the skeleton starts empty with a `// TODO` comment stating which module fills it in — that comment is your cue when you open the file in a new chat for that module.
- `app/api/*` routes are the only place that talk to Supabase/Gemini directly — keeps secrets server-side only, never exposed to the browser.
- `BUILD_SPEC.md` and `PROJECT_PLAN.md` travel inside the project folder itself so the plan is version-controlled alongside the code.
