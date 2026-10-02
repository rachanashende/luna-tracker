// Module 3 — Calendar: shared types for events, recurrence and API payloads.

/** 0 = Sunday .. 6 = Saturday — matches JS `Date.getDay()`. */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_LABELS: Record<WeekdayIndex, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

export const WEEKDAY_ORDER: WeekdayIndex[] = [0, 1, 2, 3, 4, 5, 6];

/** Row shape of the `events` table (the "master" row for one-off or recurring events). */
export interface EventRow {
  id: string;
  title: string;
  /** Anchor date: the date for a one-off event, or the first possible occurrence for a recurring one. */
  date: string; // ISO "YYYY-MM-DD"
  start_time: string | null; // "HH:MM" (24h)
  end_time: string | null;
  notes: string | null;
  recurrence_days: WeekdayIndex[] | null;
  recurrence_end_date: string | null; // ISO date, inclusive
  created_at: string;
}

/** Row shape of the `event_exceptions` table — a per-occurrence edit or cancellation. */
export interface EventExceptionRow {
  id: string;
  parent_event_id: string;
  occurrence_date: string; // ISO date
  is_cancelled: boolean;
  title: string | null;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  created_at: string;
}

/** A concrete, calendar-ready occurrence after expanding recurrence + applying exceptions. */
export interface CalendarOccurrence {
  parentId: string;
  occurrenceDate: string; // ISO date of this specific occurrence
  title: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  isRecurring: boolean;
  recurrenceDays: WeekdayIndex[] | null;
  recurrenceEndDate: string | null;
  /** True if this specific date carries a non-cancelling override (edited "this event only"). */
  isException: boolean;
}

export type EditScope = "this" | "all";

export interface CreateEventInput {
  title: string;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
  recurrence_days?: WeekdayIndex[] | null;
  recurrence_end_date?: string | null;
}

export interface UpdateEventInput {
  /** Which occurrence is being edited — required so scope="this" knows which date to override. */
  occurrence_date: string;
  scope: EditScope;
  title?: string;
  /** Only meaningful with scope "all": moves the recurring rule's anchor date. */
  date?: string;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
  recurrence_days?: WeekdayIndex[] | null;
  recurrence_end_date?: string | null;
}

export interface DeleteEventInput {
  occurrence_date: string;
  scope: EditScope;
}

export interface EventsApiResponse {
  occurrences: CalendarOccurrence[];
}
