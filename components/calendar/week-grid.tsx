"use client";

// Agenda-style week view: one column per day, events listed in time order within
// each column. (BUILD_SPEC.md asks for a "week view" without specifying an hourly
// time-grid, so this simpler agenda layout was chosen — flagged in MODULE_3_NOTES.md
// as an interpretation call, easy to upgrade to an hourly grid later if wanted.)

import { formatDayHeader, getWeekDays, isToday, toISODate } from "@/lib/dates";
import type { CalendarOccurrence } from "@/lib/events-types";
import { EventPill } from "./event-pill";

interface WeekGridProps {
  anchorDate: Date;
  occurrencesByDate: Map<string, CalendarOccurrence[]>;
  onDayClick: (date: Date) => void;
  onEventClick: (occurrence: CalendarOccurrence) => void;
}

export function WeekGrid({ anchorDate, occurrencesByDate, onDayClick, onEventClick }: WeekGridProps) {
  const days = getWeekDays(anchorDate);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
      {days.map((day) => {
        const iso = toISODate(day);
        const dayOccurrences = occurrencesByDate.get(iso) ?? [];

        return (
          <div key={iso} className="flex min-h-[10rem] flex-col rounded-xl border border-border">
            <button
              type="button"
              onClick={() => onDayClick(day)}
              className={`flex items-center justify-between border-b border-border bg-surface px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-accent/20 ${
                isToday(day) ? "text-espresso" : "opacity-70"
              }`}
              style={isToday(day) ? { color: "#3D2B24" } : undefined}
            >
              {formatDayHeader(day)}
            </button>
            <div className="flex flex-1 flex-col gap-1 p-1.5">
              {dayOccurrences.length === 0 ? (
                <button
                  type="button"
                  onClick={() => onDayClick(day)}
                  className="flex-1 rounded-md text-left text-xs opacity-40 transition-opacity hover:opacity-70"
                >
                  + Add event
                </button>
              ) : (
                dayOccurrences.map((occ) => (
                  <EventPill
                    key={`${occ.parentId}-${occ.occurrenceDate}`}
                    occurrence={occ}
                    onClick={() => onEventClick(occ)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
