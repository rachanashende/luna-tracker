"use client";

import { getMonthGridDays, isToday, toISODate } from "@/lib/dates";
import type { CalendarOccurrence } from "@/lib/events-types";
import { EventPill } from "./event-pill";

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_PER_DAY = 3;

interface MonthGridProps {
  anchorDate: Date;
  occurrencesByDate: Map<string, CalendarOccurrence[]>;
  onDayClick: (date: Date) => void;
  onEventClick: (occurrence: CalendarOccurrence) => void;
}

export function MonthGrid({ anchorDate, occurrencesByDate, onDayClick, onEventClick }: MonthGridProps) {
  const days = getMonthGridDays(anchorDate);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-surface">
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide opacity-70">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const iso = toISODate(day);
          const inCurrentMonth = day.getMonth() === anchorDate.getMonth();
          const dayOccurrences = occurrencesByDate.get(iso) ?? [];
          const overflow = dayOccurrences.length - MAX_VISIBLE_PER_DAY;

          return (
            <button
              type="button"
              key={iso}
              onClick={() => onDayClick(day)}
              className={`flex min-h-[6.5rem] flex-col items-stretch gap-1 border-b border-r border-border p-1.5 text-left align-top transition-colors last:border-r-0 hover:bg-accent/20 ${
                inCurrentMonth ? "" : "opacity-40"
              }`}
            >
              <span
                className={`self-start rounded-full px-1.5 text-xs font-semibold ${
                  isToday(day) ? "bg-accent text-espresso-dark" : ""
                }`}
                style={isToday(day) ? { color: "#3D2B24" } : undefined}
              >
                {day.getDate()}
              </span>
              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                {dayOccurrences.slice(0, MAX_VISIBLE_PER_DAY).map((occ) => (
                  <EventPill
                    key={`${occ.parentId}-${occ.occurrenceDate}`}
                    occurrence={occ}
                    onClick={() => onEventClick(occ)}
                    compact
                  />
                ))}
                {overflow > 0 && <span className="px-1 text-xs opacity-60">+{overflow} more</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
