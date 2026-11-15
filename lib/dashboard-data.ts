import { createSupabaseServerClient } from "@/lib/supabase-server";

// Queries run as the signed-in user, so Postgres row-level security returns
// only that user's rows (events, notes, journal, ...). If nobody is signed in
// the queries simply return nothing.

// "Today" is computed in this timezone rather than the server's (Workers run in
// UTC). It is fixed for all users for now — see "Known limitations" in BUILD_SPEC.md.
export const APP_TIMEZONE = "Asia/Kolkata";

function todayInAppTZ(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

export type TodayEvent = {
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
};

export type DashboardStats = {
  notesCount: number;
  activeSubjects: number;
  focusMinutesToday: number;
  journalLoggedToday: boolean;
};

export async function getTodayEvents(): Promise<TodayEvent[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, title, start_time, end_time")
      .eq("date", todayInAppTZ())
      .order("start_time", { ascending: true });

    if (error) throw error;
    return data ?? [];
  } catch {
    // `events` exists per the Module 1 schema, but Module 3 hasn't built
    // the CRUD yet — fail quietly to an empty list rather than break the page.
    return [];
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createSupabaseServerClient();
  const today = todayInAppTZ();

  const [notes, subjects, pomodoro, journal] = await Promise.allSettled([
    supabase.from("notes").select("id", { count: "exact", head: true }),
    supabase.from("subjects").select("id", { count: "exact", head: true }),
    supabase
      .from("pomodoro_logs")
      .select("duration_min")
      .gte("started_at", `${today}T00:00:00`)
      .lte("started_at", `${today}T23:59:59`),
    supabase.from("journal").select("id").eq("date", today).limit(1),
  ]);

  const notesCount = notes.status === "fulfilled" ? notes.value.count ?? 0 : 0;

  const activeSubjects =
    subjects.status === "fulfilled" ? subjects.value.count ?? 0 : 0;

  const focusMinutesToday =
    pomodoro.status === "fulfilled" && pomodoro.value.data
      ? pomodoro.value.data.reduce((sum, row) => sum + (row.duration_min ?? 0), 0)
      : 0;

  const journalLoggedToday =
    journal.status === "fulfilled" && (journal.value.data?.length ?? 0) > 0;

  return { notesCount, activeSubjects, focusMinutesToday, journalLoggedToday };
}

export function getGreeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: APP_TIMEZONE,
      hour: "numeric",
      hour12: false,
    }).format(new Date())
  );
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Winding down";
}

export function getTodayLong(): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

// Daily focus-time goal shown on the featured dashboard card. Arbitrary
// starting point — change freely, or move it into a settings table later.
export const FOCUS_GOAL_MINUTES = 120;

export function getDaySummary(stats: DashboardStats, eventCount: number): string {
  const parts: string[] = [];
  if (eventCount > 0) parts.push(`${eventCount} event${eventCount === 1 ? "" : "s"}`);
  if (stats.notesCount > 0) parts.push(`${stats.notesCount} note${stats.notesCount === 1 ? "" : "s"}`);
  if (stats.focusMinutesToday > 0) parts.push(`${stats.focusMinutesToday} min focused`);
  if (parts.length === 0) return "A quiet day so far.";
  return `${parts.join(" · ")} so far.`;
}