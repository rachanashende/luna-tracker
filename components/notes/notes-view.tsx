"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ApiError,
  Note,
  NoteResponse,
  NotesListResponse,
} from "@/lib/notes-types";
import { NOTE_SEARCH_MAX } from "@/lib/notes-types";
import NoteCard from "./note-card";
import NoteDialog from "./note-dialog";

type DialogState = { open: false } | { open: true; note: Note | null };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json().catch(() => ({}))) as T & Partial<ApiError>;
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json;
}

export default function NotesView() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const requestId = useRef(0);

  const load = useCallback(async (q: string) => {
    const id = ++requestId.current;
    setLoadError(null);
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : "";
      const data = await api<NotesListResponse>(`/api/notes${params}`);
      if (id === requestId.current) setNotes(data.notes);
    } catch (e) {
      if (id === requestId.current) {
        setLoadError(e instanceof Error ? e.message : "Couldn't load notes");
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // Debounced search; also does the initial load (empty query).
  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(() => load(q), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [query, load]);

  async function handleSave(draft: { title: string; body: string }) {
    if (dialog.open && dialog.note) {
      await api<NoteResponse>(`/api/notes/${dialog.note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
    } else {
      await api<NoteResponse>("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
    }
    setDialog({ open: false });
    await load(query.trim());
  }

  async function handleDelete(note: Note) {
    await api<{ ok: true }>(`/api/notes/${note.id}`, { method: "DELETE" });
    setDialog({ open: false });
    await load(query.trim());
  }

  const searching = query.trim() !== "";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-heading">
            Notes
          </h1>
          <p className="text-sm opacity-70">
            {loading
              ? "Loading…"
              : searching
                ? `${notes.length} match${notes.length === 1 ? "" : "es"}`
                : `${notes.length} note${notes.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ open: true, note: null })}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold shadow-sm transition hover:brightness-95"
          style={{ color: "#3D2B24" }}
        >
          + New note
        </button>
      </header>

      <div className="relative mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={NOTE_SEARCH_MAX}
          placeholder="Search titles and notes…"
          aria-label="Search notes"
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {loadError && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-red-600 dark:text-red-400"
        >
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => load(query.trim())}
            className="rounded-lg px-3 py-1 font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !loadError && notes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-serif text-xl text-heading">
            {searching ? "No notes match that search" : "No notes yet"}
          </p>
          <p className="mt-1 text-sm opacity-70">
            {searching
              ? "Try a different word, or clear the search."
              : "Capture a thought, a to-do or a lecture takeaway."}
          </p>
          {!searching && (
            <button
              type="button"
              onClick={() => setDialog({ open: true, note: null })}
              className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-semibold"
              style={{ color: "#3D2B24" }}
            >
              Write your first note
            </button>
          )}
        </div>
      )}

      {notes.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <li key={note.id}>
              <NoteCard
                note={note}
                onOpen={(n) => setDialog({ open: true, note: n })}
              />
            </li>
          ))}
        </ul>
      )}

      {dialog.open && (
        <NoteDialog
          key={dialog.note?.id ?? "new"}
          note={dialog.note}
          onClose={() => setDialog({ open: false })}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
