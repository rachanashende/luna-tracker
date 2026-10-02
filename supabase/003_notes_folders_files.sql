-- Module 4 (Notes): course folders + uploaded files.
-- Additive only. The existing `notes` table is reused: each row is now an
-- uploaded file that belongs to a course folder.

create table if not exists public.note_folders (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',   -- section / subject line, like Classroom
  color       text not null default '#F7C8D2',
  icon        text not null default '📚',
  created_at  timestamptz not null default now()
);

alter table public.note_folders enable row level security;

alter table public.notes
  add column if not exists folder_id uuid references public.note_folders(id) on delete cascade,
  add column if not exists file_path text,   -- object key inside the 'notes' storage bucket
  add column if not exists file_name text,   -- original file name
  add column if not exists file_type text,   -- mime type
  add column if not exists file_size bigint; -- bytes

create index if not exists notes_folder_id_idx on public.notes (folder_id);

-- Private bucket: files are only reachable through short-lived signed URLs
-- issued by the app's API routes (service-role client).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'notes', 'notes', false, 52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do nothing;
