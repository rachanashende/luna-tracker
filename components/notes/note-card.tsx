"use client";

import type { Note } from "@/lib/notes-types";

// Pastel category tags are identical in light/dark mode (see BUILD_SPEC), so
// the tint is a literal hex and the text on it is the dark espresso heading
// colour, which keeps contrast in both themes.
const TINTS = ["#AEE1D6", "#B8D4F0", "#FBE7B2", "#F7C8D2"] as const;

export function tintFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

export function formatUpdated(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

export default function NoteCard({
  note,
  onOpen,
}: {
  note: Note;
  onOpen: (note: Note) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(note)}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span
        aria-hidden
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: tintFor(note.id) }}
      />
      <span className="flex flex-1 flex-col gap-2 p-4">
        <span className="font-serif text-lg font-semibold leading-snug text-heading line-clamp-2 break-words">
          {note.title}
        </span>
        {note.body.trim() && (
          <span className="whitespace-pre-line break-words text-sm opacity-80 line-clamp-5">
            {note.body}
          </span>
        )}
        <span className="mt-auto pt-2 text-xs opacity-60">
          {formatUpdated(note.updated_at)}
        </span>
      </span>
    </button>
  );
}
