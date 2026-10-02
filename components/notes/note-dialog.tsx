"use client";

import { useEffect, useRef, useState } from "react";
import {
  NOTE_BODY_MAX,
  NOTE_TITLE_MAX,
  type Note,
} from "@/lib/notes-types";

interface Props {
  /** null = creating a new note */
  note: Note | null;
  onClose: () => void;
  onSave: (draft: { title: string; body: string }) => Promise<void>;
  onDelete: (note: Note) => Promise<void>;
}

export default function NoteDialog({ note, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const dirty =
    note === null
      ? title.trim() !== "" || body.trim() !== ""
      : title !== note.title || body !== note.body;
  const canSave = dirty && !saving && (title.trim() !== "" || body.trim() !== "");

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({ title, body });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!note) return;
    setSaving(true);
    setError(null);
    try {
      await onDelete(note);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  }

  function requestClose() {
    if (saving) return;
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    onClose();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") requestClose();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={note ? "Edit note" : "New note"}
        className="flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-border bg-background shadow-xl sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <h2 className="font-serif text-lg font-semibold text-heading">
            {note ? "Edit note" : "New note"}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-xl leading-none opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={NOTE_TITLE_MAX}
            placeholder="Title"
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 font-serif text-lg font-semibold text-heading placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={NOTE_BODY_MAX}
            placeholder="Write something…"
            rows={12}
            className="min-h-[40dvh] w-full flex-1 resize-y rounded-xl border border-border bg-surface px-3 py-2 text-sm leading-relaxed placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <div>
            {note &&
              (confirmingDelete ? (
                <span className="flex items-center gap-2 text-sm">
                  <span>Delete this note?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white disabled:opacity-50"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={saving}
                    className="rounded-lg px-3 py-1.5 opacity-80 hover:opacity-100"
                  >
                    Keep
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={saving}
                  className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400"
                >
                  Delete
                </button>
              ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={saving}
              className="rounded-xl px-4 py-2 text-sm opacity-80 hover:opacity-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold disabled:opacity-50"
              style={{ color: "#3D2B24" }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
