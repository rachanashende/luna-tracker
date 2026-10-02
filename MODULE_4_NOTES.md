# Module 4 — Notes — Completion Notes

Status: **code complete, verified by type-check + lint + `next build`.** Needs to be
copied into the `luna-tracker` repo and pushed (see "How to install"). No DB migration
is needed — the existing `notes` table is used as-is.

## What got built

- `lib/notes-types.ts` — `Note` row type, request/response shapes, length limits
  (title 200, body 50,000, search 100) and the `"Untitled"` fallback.
- `app/api/notes/route.ts` — `GET /api/notes?q=` (list, newest-edited first; `q` is a
  case-insensitive substring match on title **or** body) and `POST` (create).
- `app/api/notes/[id]/route.ts` — `PATCH` (title and/or body) and `DELETE`; both
  validate the id as a UUID and return 404 if the note doesn't exist.
- `components/notes/notes-view.tsx` — page state, debounced server-side search (250 ms,
  stale responses are discarded), empty/no-results/error+retry states.
- `components/notes/note-card.tsx` — card with title, body preview, last-edited time.
- `components/notes/note-dialog.tsx` — create/edit modal, inline delete confirmation,
  Esc to close, Ctrl/Cmd+S to save, "discard unsaved changes?" guard.
- `app/notes/page.tsx` — replaces the Module 1 placeholder.

## Decisions made along the way

**`updated_at` is stamped in the API, not the DB.** I checked the live table: `notes`
has `created_at`/`updated_at` defaulting to `now()` but **no trigger**, so an UPDATE
would leave `updated_at` stale. `PATCH` sets it explicitly. (If you'd rather have a DB
trigger, that's a small migration; not needed for this to work.)

**Search is `ilike` on the server, not client-side filtering.** It keeps working once
you have hundreds of notes. The user's query is wrapped in quotes inside PostgREST's
`or=` filter and `% _ \ "` are escaped, so typing a comma, parenthesis or `%` can't
break the filter or act as a wildcard.

**Untitled notes are allowed.** A note needs a title *or* some content; if the title is
blank it's stored as "Untitled". The `title` column is NOT NULL, so this avoids
rejecting quick jotted notes.

**Plain text only.** Bodies render with preserved line breaks, no markdown. A markdown
renderer is a reasonable v2 but wasn't in the spec.

**Sorted by last edited**, not created — editing a note floats it to the top.

**Card tint is derived from the note id** (one of the four pastel tag colours, same in
light/dark per the spec), purely visual — there's no colour column.

**No new dependencies**, same as Module 3 (hand-built modal).

## Known limitations

- No pagination — the list loads all notes. Fine for a personal tracker; revisit if it
  ever gets into the thousands.
- No debounce/auto-save drafts; closing with unsaved edits asks for confirmation.
- Search matches substrings only (no fuzzy/ranked search).

## How to install this into `luna-tracker`

Copy these into the repo, keeping the same relative paths:

1. `lib/notes-types.ts`
2. `app/api/notes/route.ts` (replaces the 501 stub)
3. `app/api/notes/[id]/route.ts` (new)
4. `components/notes/` (3 files)
5. `app/notes/page.tsx` (replaces the placeholder)
6. `npm run build` locally, then push — Vercel deploys automatically.

Class names used that I could not verify against your real `globals.css`:
`bg-surface`, `border-border`, `font-serif`, `text-heading`, `bg-accent`
(`bg-background` too). If any aren't real tokens, that element renders unstyled but
nothing breaks — check `/notes` after deploying. Text on pastel/accent backgrounds uses
the literal `#3D2B24` so contrast doesn't depend on those tokens.

## Verified

- `tsc --noEmit`, `eslint` on the new files, and `next build` (Next.js 16.3.8) all pass
  in a scratch project scaffolded like the real repo, using a stub `lib/supabase.ts`
  with the real factory-function shape (`getSupabaseServiceClient()`), called inside
  each handler as in Module 3. Routes resolve: `/notes`, `/api/notes`,
  `/api/notes/[id]`.
- Live `notes` table schema confirmed (id uuid, title text NOT NULL, body text NOT NULL
  default '', created_at/updated_at timestamptz default now(); no triggers).
- **Not verified:** the routes against the live DB end-to-end, and the UI in a browser
  against your real theme. Do one pass on the Vercel deploy: create → search (try a word
  from the body, and one with a comma) → edit → delete.

## Prompt to resume where this left off

Module 4's code is complete and build-verified; it just needs installing into the repo
and a smoke test on the live deploy. Once confirmed, tick Module 4 in `BUILD_SPEC.md`'s
progress tracker. Next up: Module 2 (Dashboard — can now show real events and recent
notes) or Module 5 (Journal), which only depends on Module 1.
