"use client";

import { useState } from "react";
import { MoodPicker } from "./mood-picker";
import type { JournalInput } from "@/lib/journal-types";
import { MAX_BODY_LENGTH } from "@/lib/journal-limits";

type Props = {
  /** Current date for the form. Changes from the parent are picked up. */
  date: string;
  maxDate: string;
  initialMood?: string | null;
  initialBody?: string;
  placeholder?: string;
  submitLabel: string;
  /** Clear the text + mood after a successful save (composer). */
  resetOnSuccess?: boolean;
  autoFocus?: boolean;
  onSubmit: (input: JournalInput) => Promise<void>;
  onCancel?: () => void;
};

export function EntryForm({
  date: dateProp,
  maxDate,
  initialMood = null,
  initialBody = "",
  placeholder,
  submitLabel,
  resetOnSuccess,
  autoFocus,
  onSubmit,
  onCancel,
}: Props) {
  const [date, setDate] = useState(dateProp);
  const [prevDateProp, setPrevDateProp] = useState(dateProp);
  const [mood, setMood] = useState<string | null>(initialMood);
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Follow the parent's date (e.g. a calendar click) without an effect.
  if (dateProp !== prevDateProp) {
    setPrevDateProp(dateProp);
    setDate(dateProp);
  }

  async function submit() {
    if (saving) return;
    if (!body.trim()) {
      setError("Write something first");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ date, mood, body });
      if (resetOnSuccess) {
        setBody("");
        setMood(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save — try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="opacity-70">Date</span>
          <input
            type="date"
            value={date}
            max={maxDate}
            required
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
          />
        </label>
        <span className="text-xs opacity-60" aria-live="polite">
          {body.length.toLocaleString()} / {MAX_BODY_LENGTH.toLocaleString()}
        </span>
      </div>

      <div>
        <p className="mb-2 text-sm opacity-70">How are you feeling?</p>
        <MoodPicker value={mood} onChange={setMood} />
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            void submit();
          }
        }}
        autoFocus={autoFocus}
        maxLength={MAX_BODY_LENGTH}
        rows={6}
        placeholder={placeholder}
        aria-label="Journal entry"
        className="w-full resize-y rounded-xl border border-border bg-background p-3.5 text-[15px] leading-relaxed placeholder:opacity-50"
      />

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <span className="mr-auto hidden text-xs opacity-50 sm:inline">
          Ctrl/⌘ + Enter to save
        </span>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-full px-4 py-2 text-sm hover:bg-accent/30 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          style={{ color: "#3D2B24" }}
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium transition hover:brightness-95 disabled:opacity-60"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
