"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { EntryForm } from "./entry-form";
import { getMood, TAG_BG, TAG_TEXT_COLOR } from "@/lib/journal-moods";
import type { JournalEntry, JournalInput } from "@/lib/journal-types";

type Props = {
  entry: JournalEntry;
  maxDate: string;
  onUpdate: (id: string, input: JournalInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function EntryCard({ entry, maxDate, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mood = getMood(entry.mood);
  const time = new Date(entry.created_at).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const edited =
    entry.updated_at &&
    new Date(entry.updated_at).getTime() - new Date(entry.created_at).getTime() > 60_000;

  if (editing) {
    return (
      <article className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <EntryForm
          date={entry.date}
          maxDate={maxDate}
          initialMood={entry.mood}
          initialBody={entry.body}
          submitLabel="Save changes"
          autoFocus
          onCancel={() => setEditing(false)}
          onSubmit={async (input) => {
            await onUpdate(entry.id, input);
            setEditing(false);
          }}
        />
      </article>
    );
  }

  async function confirmDelete() {
    setBusy(true);
    setError(null);
    try {
      await onDelete(entry.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete — try again");
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <article className="group rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <header className="mb-2 flex items-center gap-2.5">
        {mood ? (
          <span
            style={{ color: TAG_TEXT_COLOR }}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TAG_BG[mood.tag]}`}
          >
            <span aria-hidden="true">{mood.emoji}</span>
            {mood.label}
          </span>
        ) : (
          <span className="text-xs opacity-50">No mood</span>
        )}
        <span className="text-xs opacity-60">
          {time}
          {edited ? " · edited" : ""}
        </span>

        <div className="ml-auto flex items-center gap-1">
          {confirming ? (
            <>
              <span className="mr-1 text-xs opacity-70">Delete this entry?</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmDelete()}
                className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirming(false)}
                className="rounded-full px-3 py-1 text-xs hover:bg-accent/30"
              >
                Keep
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Edit entry"
                className="rounded-full p-1.5 opacity-60 transition hover:bg-accent/30 hover:opacity-100 focus-visible:opacity-100"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                aria-label="Delete entry"
                className="rounded-full p-1.5 opacity-60 transition hover:bg-accent/30 hover:opacity-100 focus-visible:opacity-100"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </header>

      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
        {entry.body}
      </p>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </article>
  );
}
