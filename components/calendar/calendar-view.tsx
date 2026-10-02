"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  formatMonthLabel,
  formatWeekRangeLabel,
  getMonthGridDays,
  getWeekDays,
  toISODate,
} from "@/lib/dates";
import type {
  CalendarOccurrence,
  CreateEventInput,
  DeleteEventInput,
  EventsApiResponse,
  UpdateEventInput,
} from "@/lib/events-types";
import { MonthGrid } from "./month-grid";
import { WeekGrid } from "./week-grid";
import { EventDialog } from "./event-dialog";

type ViewMode = "month" | "week";

type DialogState =
  | { open: false }
  | { open: true; mode: "create"; date: Date }
  | { open: true; mode: "edit"; occurrence: CalendarOccurrence };

export function CalendarView() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [occurrences, setOccurrences] = useState<CalendarOccurrence[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ open: false });

  const range = useMemo(() => {
    const days = viewMode === "month" ? getMonthGridDays(anchorDate) : getWeekDays(anchorDate);
    return { start: days[0], end: days[days.length - 1] };
  }, [viewMode, anchorDate]);

  const fetchOccurrences = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        start: toISODate(range.start),
        end: toISODate(range.end),
      });
      const res = await fetch(`/api/events?${params.toString()}`);
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to load events");
      const data = (await res.json()) as EventsApiResponse;
      setOccurrences(data.occurrences);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [range.start, range.end]);

  useEffect(() => {
    fetchOccurrences();
  }, [fetchOccurrences]);

  const occurrencesByDate = useMemo(() => {
    const map = new Map<string, CalendarOccurrence[]>();
    for (const occ of occurrences) {
      const list = map.get(occ.occurrenceDate) ?? [];
      list.push(occ);
      map.set(occ.occurrenceDate, list);
    }
    return map;
  }, [occurrences]);

  function goToday() {
    setAnchorDate(new Date());
  }

  function goPrev() {
    setAnchorDate((d) => (viewMode === "month" ? addMonths(d, -1) : addDays(d, -7)));
  }

  function goNext() {
    setAnchorDate((d) => (viewMode === "month" ? addMonths(d, 1) : addDays(d, 7)));
  }

  async function handleCreate(input: CreateEventInput) {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Couldn't create event");
    await fetchOccurrences();
  }

  async function handleUpdate(parentId: string, input: UpdateEventInput) {
    const res = await fetch(`/api/events/${parentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Couldn't save event");
    await fetchOccurrences();
  }

  async function handleDelete(parentId: string, input: DeleteEventInput) {
    const params = new URLSearchParams({ occurrence_date: input.occurrence_date, scope: input.scope });
    const res = await fetch(`/api/events/${parentId}?${params.toString()}`, { method: "DELETE" });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Couldn't delete event");
    await fetchOccurrences();
  }

  const headerLabel =
    viewMode === "month" ? formatMonthLabel(anchorDate) : formatWeekRangeLabel(getWeekDays(anchorDate));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-surface"
            aria-label="Previous"
          >
            ←
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-surface"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-surface"
            aria-label="Next"
          >
            →
          </button>
          <h1 className="ml-2 font-serif text-xl font-semibold">{headerLabel}</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-border text-sm">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 transition-colors ${viewMode === "month" ? "bg-accent" : "hover:bg-surface"}`}
              style={viewMode === "month" ? { color: "#3D2B24" } : undefined}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 transition-colors ${viewMode === "week" ? "bg-accent" : "hover:bg-surface"}`}
              style={viewMode === "week" ? { color: "#3D2B24" } : undefined}
            >
              Week
            </button>
          </div>
          <button
            type="button"
            onClick={() => setDialog({ open: true, mode: "create", date: anchorDate })}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
            style={{ color: "#3D2B24" }}
          >
            + New event
          </button>
        </div>
      </div>

      {loadError && (
        <p className="rounded-lg border border-red-300 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {loadError}
        </p>
      )}

      <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        {viewMode === "month" ? (
          <MonthGrid
            anchorDate={anchorDate}
            occurrencesByDate={occurrencesByDate}
            onDayClick={(date) => setDialog({ open: true, mode: "create", date })}
            onEventClick={(occurrence) => setDialog({ open: true, mode: "edit", occurrence })}
          />
        ) : (
          <WeekGrid
            anchorDate={anchorDate}
            occurrencesByDate={occurrencesByDate}
            onDayClick={(date) => setDialog({ open: true, mode: "create", date })}
            onEventClick={(occurrence) => setDialog({ open: true, mode: "edit", occurrence })}
          />
        )}
      </div>

      {dialog.open && (
        <EventDialog
          mode={dialog.mode}
          initialDate={dialog.mode === "create" ? dialog.date : new Date()}
          occurrence={dialog.mode === "edit" ? dialog.occurrence : undefined}
          onClose={() => setDialog({ open: false })}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
