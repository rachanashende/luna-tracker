import { expandEventOccurrences, expandAllEvents } from "../lib/recurrence";
import type { EventRow, EventExceptionRow } from "../lib/events-types";

let failures = 0;
function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.error(`FAIL: ${label}\n  expected: ${e}\n  actual:   ${a}`);
  } else {
    console.log(`ok: ${label}`);
  }
}

function makeEvent(overrides: Partial<EventRow>): EventRow {
  return {
    id: "e1",
    title: "Test",
    date: "2026-09-01",
    start_time: null,
    end_time: null,
    notes: null,
    recurrence_days: null,
    recurrence_end_date: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// 1. One-off event inside range
{
  const ev = makeEvent({ date: "2026-09-15" });
  const occ = expandEventOccurrences(ev, "2026-09-01", "2026-09-30");
  assertEqual(occ.length, 1, "one-off in range: count");
  assertEqual(occ[0]?.occurrenceDate, "2026-09-15", "one-off in range: date");
}

// 2. One-off event outside range
{
  const ev = makeEvent({ date: "2026-08-15" });
  const occ = expandEventOccurrences(ev, "2026-09-01", "2026-09-30");
  assertEqual(occ.length, 0, "one-off outside range: count");
}

// 3. Recurring Mon/Wed/Fri (1,3,5) across September 2026 (Sept 1 2026 is a Tuesday)
{
  const ev = makeEvent({ date: "2026-09-01", recurrence_days: [1, 3, 5] });
  const occ = expandEventOccurrences(ev, "2026-09-01", "2026-09-07");
  // Sept 1 = Tue, Sept 2 = Wed, Sept 3 = Thu, Sept 4 = Fri, Sept 7 = Mon
  assertEqual(
    occ.map((o) => o.occurrenceDate),
    ["2026-09-02", "2026-09-04", "2026-09-07"],
    "recurring Mon/Wed/Fri: first week"
  );
}

// 4. Recurring event respects recurrence_end_date
{
  const ev = makeEvent({
    date: "2026-09-01",
    recurrence_days: [1, 3, 5],
    recurrence_end_date: "2026-09-03",
  });
  const occ = expandEventOccurrences(ev, "2026-09-01", "2026-09-14");
  assertEqual(occ.map((o) => o.occurrenceDate), ["2026-09-02"], "recurring with end date cuts off series");
}

// 5. Recurring event doesn't start before its anchor date even if range starts earlier
{
  const ev = makeEvent({ date: "2026-09-10", recurrence_days: [0, 6] }); // Sun, Sat
  const occ = expandEventOccurrences(ev, "2026-09-01", "2026-09-30");
  assertEqual(
    occ.every((o) => o.occurrenceDate >= "2026-09-10"),
    true,
    "recurring event never occurs before its anchor date"
  );
}

// 6. Cancelled exception hides just that one occurrence
{
  const ev = makeEvent({ date: "2026-09-01", recurrence_days: [1, 3, 5] });
  const exceptions: EventExceptionRow[] = [
    {
      id: "ex1",
      parent_event_id: "e1",
      occurrence_date: "2026-09-04",
      is_cancelled: true,
      title: null,
      start_time: null,
      end_time: null,
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
    },
  ];
  const occ = expandEventOccurrences(ev, "2026-09-01", "2026-09-07", exceptions);
  assertEqual(
    occ.map((o) => o.occurrenceDate),
    ["2026-09-02", "2026-09-07"],
    "cancelled exception removes just that date"
  );
}

// 7. Non-cancelling exception overrides fields for just that occurrence
{
  const ev = makeEvent({ title: "Gym", date: "2026-09-01", recurrence_days: [1, 3, 5] });
  const exceptions: EventExceptionRow[] = [
    {
      id: "ex2",
      parent_event_id: "e1",
      occurrence_date: "2026-09-04",
      is_cancelled: false,
      title: "Gym (moved room)",
      start_time: "07:00",
      end_time: null,
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
    },
  ];
  const occ = expandEventOccurrences(ev, "2026-09-01", "2026-09-07", exceptions);
  const overridden = occ.find((o) => o.occurrenceDate === "2026-09-04");
  assertEqual(overridden?.title, "Gym (moved room)", "exception overrides title for just that date");
  assertEqual(overridden?.isException, true, "exception marks isException true");
  const untouched = occ.find((o) => o.occurrenceDate === "2026-09-02");
  assertEqual(untouched?.title, "Gym", "other occurrences keep original title");
}

// 8. expandAllEvents sorts by date then time across multiple events
{
  const events: EventRow[] = [
    makeEvent({ id: "a", title: "B", date: "2026-09-05", start_time: "10:00" }),
    makeEvent({ id: "b", title: "A", date: "2026-09-05", start_time: "08:00" }),
    makeEvent({ id: "c", title: "C", date: "2026-09-04" }),
  ];
  const occ = expandAllEvents(events, new Map(), "2026-09-01", "2026-09-30");
  assertEqual(
    occ.map((o) => o.title),
    ["C", "A", "B"],
    "expandAllEvents sorts by date then start time"
  );
}

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
} else {
  console.log("\nAll recurrence tests passed");
}
