import { createClient } from "@supabase/supabase-js";

/**
 * ASSUMPTION: Module 1's lib/supabase.ts already exports a server-only
 * service-role client. If its export name differs from what's below, swap
 * this for e.g. `import { supabaseService } from "@/lib/supabase"` — I
 * built this without seeing that file directly, so it's self-contained
 * for now. Same for the env var name below; FILE_STRUCTURE.md confirms
 * SUPABASE_SERVICE_ROLE_KEY but not the URL var name, so I guessed the
 * Next.js-conventional NEXT_PUBLIC_SUPABASE_URL.
 */
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Single-user app based in Bengaluru — "today" should mean today in this
// timezone, not the server's (Vercel defaults to UTC). Change if needed.
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
    const supabase = getServiceClient();
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
  const supabase = getServiceClient();
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