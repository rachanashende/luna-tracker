// Module 3 — Calendar: expands `events` rows (one-off or recurring) into concrete,
// render-ready occurrences for a given date range, applying per-occurrence exceptions.

import { addDays, fromISODate, toISODate } from "./dates";
import type {
  CalendarOccurrence,
  EventExceptionRow,
  EventRow,
  WeekdayIndex,
} from "./events-types";

/**
 * Expands one `events` row into occurrences within [rangeStartISO, rangeEndISO] (inclusive).
 * - One-off events (recurrence_days null/empty): at most one occurrence, only if `date` is in range.
 * - Recurring events: one occurrence per matching weekday between
 *   max(date, rangeStart) and min(recurrence_end_date ?? rangeEnd, rangeEnd),
 *   skipping cancelled exceptions and applying override fields from non-cancelled ones.
 */
export function expandEventOccurrences(
  event: EventRow,
  rangeStartISO: string,
  rangeEndISO: string,
  exceptions: EventExceptionRow[] = []
): CalendarOccurrence[] {
  const exceptionsByDate = new Map(exceptions.map((e) => [e.occurrence_date, e]));
  const isRecurring = !!event.recurrence_days && event.recurrence_days.length > 0;

  if (!isRecurring) {
    if (event.date < rangeStartISO || event.date > rangeEndISO) return [];
    const ex = exceptionsByDate.get(event.date);
    if (ex?.is_cancelled) return [];
    return [toOccurrence(event, event.date, ex)];
  }

  const days = new Set<WeekdayIndex>(event.recurrence_days!);
  const windowStartISO = event.date > rangeStartISO ? event.date : rangeStartISO;
  const cappedEndISO =
    event.recurrence_end_date && event.recurrence_end_date < rangeEndISO
      ? event.recurrence_end_date
      : rangeEndISO;
  if (windowStartISO > cappedEndISO) return [];

  const occurrences: CalendarOccurrence[] = [];
  let cursor = fromISODate(windowStartISO);
  const end = fromISODate(cappedEndISO);
  while (cursor <= end) {
    const iso = toISODate(cursor);
    if (days.has(cursor.getDay() as WeekdayIndex)) {
      const ex = exceptionsByDate.get(iso);
      if (!ex?.is_cancelled) {
        occurrences.push(toOccurrence(event, iso, ex));
      }
    }
    cursor = addDays(cursor, 1);
  }
  return occurrences;
}

function toOccurrence(event: EventRow, occurrenceDate: string, ex?: EventExceptionRow): CalendarOccurrence {
  return {
    parentId: event.id,
    occurrenceDate,
    title: ex?.title ?? event.title,
    startTime: ex?.start_time ?? event.start_time,
    endTime: ex?.end_time ?? event.end_time,
    notes: ex?.notes ?? event.notes,
    isRecurring: !!event.recurrence_days && event.recurrence_days.length > 0,
    recurrenceDays: event.recurrence_days,
    recurrenceEndDate: event.recurrence_end_date,
    isException: !!ex && !ex.is_cancelled,
  };
}

/** Expands a full set of events + their exceptions and returns a flat, date/time-sorted list. */
export function expandAllEvents(
  events: EventRow[],
  exceptionsByParent: Map<string, EventExceptionRow[]>,
  rangeStartISO: string,
  rangeEndISO: string
): CalendarOccurrence[] {
  const all: CalendarOccurrence[] = [];
  for (const event of events) {
    const exs = exceptionsByParent.get(event.id) ?? [];
    all.push(...expandEventOccurrences(event, rangeStartISO, rangeEndISO, exs));
  }
  return all.sort((a, b) => {
    if (a.occurrenceDate !== b.occurrenceDate) return a.occurrenceDate < b.occurrenceDate ? -1 : 1;
    const at = a.startTime ?? "99:99";
    const bt = b.startTime ?? "99:99";
    return at < bt ? -1 : at > bt ? 1 : 0;
  });
}
