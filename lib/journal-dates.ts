// Local-date helpers. Everything works off local Date fields, never
// toISOString() — UTC conversion would shift dates across midnight.

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

/** Local noon avoids DST edge cases when only the calendar day matters. */
export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function monthKey(year: number, month: number): string {
  return `${year}-${pad(month + 1)}`;
}

export function monthRange(year: number, month: number) {
  const last = new Date(year, month + 1, 0).getDate();
  return {
    start: `${year}-${pad(month + 1)}-01`,
    end: `${year}-${pad(month + 1)}-${pad(last)}`,
  };
}

/** Sunday-first grid cells: leading nulls, then each day of the month. */
export function monthCells(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) {
    cells.push(`${year}-${pad(month + 1)}-${pad(d)}`);
  }
  return cells;
}

export function formatMonthTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function formatLongDate(s: string): string {
  return parseDateStr(s).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatDayHeading(s: string, today: string): string {
  if (s === today) return "Today";
  const y = parseDateStr(today);
  y.setDate(y.getDate() - 1);
  if (s === toDateStr(y)) return "Yesterday";
  return parseDateStr(s).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: parseDateStr(s).getFullYear() === y.getFullYear() ? undefined : "numeric",
  });
}

export function dayOfYear(s: string): number {
  const d = parseDateStr(s);
  const start = new Date(d.getFullYear(), 0, 0, 12);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}
