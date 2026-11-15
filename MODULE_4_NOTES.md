# Module 4 — Notes — Completion Notes

Status: **code complete, verified by type-check + lint + `next build`; DB migration and
storage bucket applied to the live Supabase project.** App code still needs copying into
the `luna-tracker` repo and a smoke test on the live deploy (see below).

## What changed vs. the original spec

`BUILD_SPEC.md` described Module 4 as typed notes (create/edit/delete text + search).
That wasn't the intent. Module 4 is now **uploaded note files organised into course
folders, with a Google Classroom–style interface**:

- `/notes` — a grid of **course cards** (coloured banner, name, section line, emoji
  avatar, file count). "+ New course" creates one.
- Each course is **customizable**: name, section/subject line, banner colour (8 pastels),
  icon (16 emoji), with a live preview. Edit from the ⋮ menu on a card or the course page.
- `/notes/[folderId]` — the **course page**: big banner, "Upload notes" button, drag-and-drop
  anywhere on the page, multi-file upload, and a Classroom-style list of files (type badge,
  title, upload date, size). Per-file ⋮ menu: Open, Download, Rename / move, Delete.
- Search box filters files within a course (by title / file name).

Suggested edit to the Module 4 section of `BUILD_SPEC.md`: replace the Build bullets with
"course folders (create/customize/delete); upload note files into a course; open, download,
rename, move, delete files; Classroom-style layout", and the DoD with "You can create a
course, customize it, upload files into it, and open/download/delete them."

## What got built

- `supabase/003_notes_folders_files.sql` — **already applied to the live project.** New
  `note_folders` table (name, description, color, icon); `notes` reused with new columns
  `folder_id` (FK, cascade), `file_path`, `file_name`, `file_type`, `file_size`; a
  **private** storage bucket `notes` (50 MB limit, mime allow-list).
- `lib/notes-types.ts`, `lib/note-files.ts` (allowed types, badges, size formatting),
  `lib/notes-server.ts` (validation helpers), `lib/notes-client.ts` (fetch helper).
- API routes:
  - `GET/POST /api/notes/folders`, `GET/PATCH/DELETE /api/notes/folders/[id]`
  - `POST /api/notes/upload-url` → signed upload slot
  - `GET /api/notes?folder_id=`, `POST /api/notes` (register uploaded file)
  - `PATCH/DELETE /api/notes/[id]` (rename/move, delete)
  - `GET /api/notes/[id]/file[?download=1]` → 60-second signed URL redirect
- Components in `components/notes/`: `folders-view`, `folder-card`, `folder-view`,
  `folder-dialog`, `file-row`, `file-dialog`, `confirm-dialog`, `kebab-menu`, `modal`.
- Pages: `app/notes/page.tsx` (replaces placeholder), `app/notes/[folderId]/page.tsx`.

## Decisions made along the way

**Uploads go browser → Supabase Storage directly**, not through a Next.js route.
Serverless hosts cap request bodies (Vercel, where this was first built, caps them at
~4.5 MB), which a lecture PDF/PPT easily exceeds — and going direct to Supabase keeps
large uploads off the app server on Cloudflare Workers too. Flow: the browser
asks `/api/notes/upload-url` (server validates type/size/course and issues a signed upload
token) → uploads with `getSupabaseBrowserClient().storage.uploadToSignedUrl` → calls
`POST /api/notes` to record it. If recording fails, the stored object is removed.

**Bucket is private.** Files are opened through `/api/notes/[id]/file`, which redirects to
a 60-second signed URL. PDFs/images show in the browser; "Download" forces a save.

**Reused the `notes` table** (it was empty) rather than creating a new files table. Each
row is now one uploaded file; `body` is left unused (empty string).

**Deleting a course deletes its files** (storage objects first, then the rows via cascade).
Both delete actions ask for confirmation.

**Supported types:** PDF, Word (doc/docx), PowerPoint (ppt/pptx), Excel/CSV, txt/md, and
images (png/jpg/webp/gif); max 50 MB each. The allow-list lives in `lib/note-files.ts` and
must stay in sync with the bucket's `allowed_mime_types`.

**No new dependencies**; modal/menu hand-built like Module 3.

## Known limitations

- No in-app preview — files open in a new tab (PDFs/images preview natively; Office files
  download).
- No upload progress bar (shows "Uploading…" per file). No folder nesting or reordering;
  courses are listed oldest-first.
- Search is per course and only matches file titles, not text inside the files.
- Moving a file between courses changes its course but not its storage path (harmless).

## How to install this into `luna-tracker`

1. ~~Run the migration~~ — **done**, applied live; `.sql` file is for repo history only.
2. Copy `lib/*` (5 files), `components/notes/*` (9 files), `app/notes/page.tsx`,
   `app/notes/[folderId]/page.tsx`, and everything under `app/api/notes/` into the repo at
   the same paths (this replaces the 501 stub in `app/api/notes/route.ts` and the Module 1
   placeholder page).
3. Build locally, push, and let Cloudflare deploy (hosting moved from Vercel to
   Cloudflare Workers — see `BUILD_SPEC.md` → "Hosting migration").
4. Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in
   Cloudflare, as both runtime variables and build variables — the browser client
   needs them to upload.

Tailwind classes I couldn't verify against your real `globals.css`: `bg-surface`,
`border-border`, `font-serif`, `text-heading`, `bg-accent`, `bg-background`. If a token is
missing, that element looks unstyled but nothing breaks. Text on pastel backgrounds uses
the literal `#3D2B24`.

## Verified

- Migration applied on the live `luna-tracker` project; confirmed `notes` has the new
  columns, `note_folders` exists, and the `notes` bucket is private with a 50 MB limit.
- `tsc --noEmit`, `eslint`, and `next build` (Next.js 16.3.8) pass in a scratch project
  using a stub `lib/supabase.ts` with your real factory-function shape. All 8 routes resolve.
- **Not verified:** the API routes and storage upload against the live backend (the
  service-role key isn't available to me), and the UI in a browser against your real theme.
  Smoke test on the deploy: create a course → customize it → upload a PDF and a PPTX →
  open and download them → rename/move one → delete a file → delete the course.

## Prompt to resume where this left off

Module 4 (Notes as Classroom-style course folders with file upload) is code-complete and
build-verified, with its migration and storage bucket live. Copy the files into the repo,
deploy, and run the smoke test above. Once confirmed, update Module 4 in `BUILD_SPEC.md`
and tick it in the progress tracker. Next: Module 2 (Dashboard — can now show recent
uploads and course count) or Module 5 (Journal).
