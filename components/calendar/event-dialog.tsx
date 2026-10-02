"use client";

import { useEffect, useMemo, useState } from "react";
import { toISODate } from "@/lib/dates";
import {
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  type CalendarOccurrence,
  type CreateEventInput,
  type DeleteEventInput,
  type EditScope,
  type UpdateEventInput,
  type WeekdayIndex,
} from "@/lib/events-types";

interface EventDialogProps {
  mode: "create" | "edit";
  initialDate: Date;
  /** Required when mode === "edit". */
  occurrence?: CalendarOccurrence;
  onClose: () => void;
  onCreate: (input: CreateEventInput) => Promise<void>;
  onUpdate: (parentId: string, input: UpdateEventInput) => Promise<void>;
  onDelete: (parentId: string, input: DeleteEventInput) => Promise<void>;
}

export function EventDialog({ mode, initialDate, occurrence, onClose, onCreate, onUpdate, onDelete }: EventDialogProps) {
  const isEdit = mode === "edit" && !!occurrence;
  const wasRecurring = !!occurrence?.isRecurring;

  const [title, setTitle] = useState(occurrence?.title ?? "");
  const [date, setDate] = useState(occurrence?.occurrenceDate ?? toISODate(initialDate));
  const [startTime, setStartTime] = useState(occurrence?.startTime ?? "");
  const [endTime, setEndTime] = useState(occurrence?.endTime ?? "");
  const [notes, setNotes] = useState(occurrence?.notes ?? "");
  const [scope, setScope] = useState<EditScope>("this");
  const [repeats, setRepeats] = useState(wasRecurring);
  const [recurrenceDays, setRecurrenceDays] = useState<Set<WeekdayIndex>>(
    new Set(occurrence?.recurrenceDays ?? [])
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(occurrence?.recurrenceEndDate ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const showScopeChoice = isEdit && wasRecurring;
  // Scope "this" can only edit a single occurrence's content — the recurrence pattern
  // itself belongs to the master row, so the repeat editor is hidden in that case.
  const showRepeatEditor = mode === "create" || !wasRecurring || scope === "all";
  const dateDisabled = isEdit && wasRecurring && scope === "this";

  function toggleDay(day: WeekdayIndex) {
    setRecurrenceDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  const effectiveRecurrenceDays = useMemo(
    () => (repeats ? WEEKDAY_ORDER.filter((d) => recurrenceDays.has(d)) : null),
    [repeats, recurrenceDays]
  );

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }
    if (repeats && (!effectiveRecurrenceDays || effectiveRecurrenceDays.length === 0)) {
      setError("Pick at least one day for the event to repeat on, or turn off Repeats.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (!isEdit) {
        await onCreate({
          title: title.trim(),
          date,
          start_time: startTime || null,
          end_time: endTime || null,
          notes: notes || null,
          recurrence_days: effectiveRecurrenceDays,
          recurrence_end_date: repeats ? recurrenceEndDate || null : null,
        });
      } else {
        const effectiveScope: EditScope = wasRecurring ? scope : "all";
        await onUpdate(occurrence!.parentId, {
          occurrence_date: occurrence!.occurrenceDate,
          scope: effectiveScope,
          title: title.trim(),
          date: effectiveScope === "all" ? date : undefined,
          start_time: startTime || null,
          end_time: endTime || null,
          notes: notes || null,
          recurrence_days: effectiveScope === "all" ? effectiveRecurrenceDays : undefined,
          recurrence_end_date:
            effectiveScope === "all" ? (repeats ? recurrenceEndDate || null : null) : undefined,
        });
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEdit) return;
    setSaving(true);
    setError(null);
    try {
      const effectiveScope: EditScope = wasRecurring ? scope : "all";
      await onDelete(occurrence!.parentId, {
        occurrence_date: occurrence!.occurrenceDate,
        scope: effectiveScope,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete this event. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-serif text-lg font-semibold">
          {isEdit ? "Edit event" : "New event"}
        </h2>

        {showScopeChoice && (
          <fieldset className="mb-4 flex gap-4 text-sm">
            <legend className="mb-1 w-full text-xs font-semibold uppercase tracking-wide opacity-70">
              Applies to
            </legend>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="scope"
                checked={scope === "this"}
                onChange={() => setScope("this")}
              />
              This event
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="scope"
                checked={scope === "all"}
                onChange={() => setScope("all")}
              />
              All events in the series
            </label>
          </fieldset>
        )}

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              placeholder="Event title"
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
              Date {dateDisabled && "(edit the whole series to change this)"}
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={dateDisabled}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50"
            />
          </label>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Start</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide opacity-70">End</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              placeholder="Optional notes"
            />
          </label>

          {showRepeatEditor && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={repeats} onChange={(e) => setRepeats(e.target.checked)} />
              Repeats weekly
            </label>
          )}

          {repeats && showRepeatEditor && (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-2.5">
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_ORDER.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`h-8 w-10 rounded-md border border-border text-xs font-semibold transition-colors ${
                      recurrenceDays.has(day) ? "bg-accent" : "bg-surface opacity-60"
                    }`}
                    style={recurrenceDays.has(day) ? { color: "#3D2B24" } : undefined}
                  >
                    {WEEKDAY_LABELS[day]}
                  </button>
                ))}
              </div>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  Ends (optional)
                </span>
                <input
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                />
              </label>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
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
