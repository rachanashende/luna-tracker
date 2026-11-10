"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthTitle, monthCells } from "@/lib/journal-dates";
import { getMood, TAG_BG } from "@/lib/journal-moods";
import type { JournalEntry } from "@/lib/journal-types";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type Props = {
  year: number;
  month: number; // 0-based
  today: string;
  selected: string | null;
  entriesByDate: Map<string, JournalEntry[]>;
  onSelect: (date: string | null) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

export function JournalCalendar({
  year,
  month,
  today,
  selected,
  entriesByDate,
  onSelect,
  onPrev,
  onNext,
  onToday,
}: Props) {
  const cells = monthCells(year, month);
  const atCurrentMonth =
    today.slice(0, 7) === `${year}-${String(month + 1).padStart(2, "0")}`;

  return (
    <section
      aria-label="Journal calendar"
      className="rounded-2xl border border-border bg-surface p-4"
    >
      <div className="mb-3 flex items-center gap-1">
        <h2 className="mr-auto font-display text-lg text-heading">
          {formatMonthTitle(year, month)}
        </h2>
        {!atCurrentMonth && (
          <button
            type="button"
            onClick={onToday}
            className="rounded-full px-2.5 py-1 text-xs hover:bg-accent/30"
          >
            Today
          </button>
        )}
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous month"
          className="rounded-full p-1.5 hover:bg-accent/30"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next month"
          className="rounded-full p-1.5 hover:bg-accent/30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="pb-1 text-[11px] font-medium opacity-50" aria-hidden="true">
            {d}
          </div>
        ))}

        {cells.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} />;
          const entries = entriesByDate.get(date) ?? [];
          const isFuture = date > today;
          const isToday = date === today;
          const isSelected = date === selected;
          const dotMood = getMood(entries.find((e) => e.mood)?.mood);
          const day = Number(date.slice(8));

          return (
            <button
              key={date}
              type="button"
              disabled={isFuture}
              aria-pressed={isSelected}
              aria-label={`${date}${
                entries.length
                  ? `, ${entries.length} ${entries.length === 1 ? "entry" : "entries"}`
                  : ""
              }`}
              onClick={() => onSelect(isSelected ? null : date)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors disabled:cursor-default disabled:opacity-30 ${
                isSelected
                  ? "bg-accent font-semibold"
                  : "hover:bg-accent/30"
              } ${isToday && !isSelected ? "ring-1 ring-accent" : ""}`}
              style={isSelected ? { color: "#3D2B24" } : undefined}
            >
              {day}
              {entries.length > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${
                    dotMood ? TAG_BG[dotMood.tag] : "bg-heading opacity-40"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
