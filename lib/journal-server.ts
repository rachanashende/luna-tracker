import { MAX_BODY_LENGTH } from "./journal-limits";
import { MOOD_KEYS } from "./journal-moods";
import type { JournalInput } from "./journal-types";

export function isValidDateStr(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
}

export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Consecutive days with an entry, ending on `today`. 0 if today has none. */
export function computeStreak(dates: string[], today: string): number {
  const set = new Set(dates);
  let n = 0;
  let d = today;
  while (set.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

type ParseResult =
  | { ok: true; value: Partial<JournalInput> }
  | { ok: false; error: string };

export function parseEntryInput(
  raw: unknown,
  mode: "create" | "update",
): ParseResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "Invalid request body" };
  }
  const r = raw as Record<string, unknown>;
  const out: Partial<JournalInput> = {};

  if (mode === "create" || "date" in r) {
    if (!isValidDateStr(r.date)) {
      return { ok: false, error: "date must be a valid YYYY-MM-DD" };
    }
    out.date = r.date;
  }

  if ("mood" in r) {
    if (r.mood === null || r.mood === "") {
      out.mood = null;
    } else if (typeof r.mood === "string" && MOOD_KEYS.includes(r.mood)) {
      out.mood = r.mood;
    } else {
      return { ok: false, error: "Unknown mood" };
    }
  }

  if (mode === "create" || "body" in r) {
    if (typeof r.body !== "string") {
      return { ok: false, error: "body must be text" };
    }
    const body = r.body.trim();
    if (!body) return { ok: false, error: "Write something first" };
    if (body.length > MAX_BODY_LENGTH) {
      return { ok: false, error: `Entries are limited to ${MAX_BODY_LENGTH} characters` };
    }
    out.body = body;
  }

  if (mode === "update" && Object.keys(out).length === 0) {
    return { ok: false, error: "Nothing to update" };
  }
  return { ok: true, value: out };
}
