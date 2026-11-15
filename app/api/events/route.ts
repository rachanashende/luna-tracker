// Module 3 — Calendar: list + create events.
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserClient, unauthorized } from "@/lib/supabase-server";
import { expandAllEvents } from "@/lib/recurrence";
import type { CreateEventInput, EventExceptionRow, EventRow } from "@/lib/events-types";

// GET /api/events?start=YYYY-MM-DD&end=YYYY-MM-DD
// Returns every occurrence (one-off + expanded recurring) overlapping [start, end].
export async function GET(request: NextRequest) {
  const ctx = await getSupabaseUserClient();
  if (!ctx) return unauthorized();
  const db = ctx.supabase;
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json(
      { error: "start and end query params (YYYY-MM-DD) are required" },
      { status: 400 }
    );
  }

  // Single-user app, so the events table stays small — simplest and safest to fetch
  // every row and filter/expand in JS rather than lean on a fragile OR-filter string
  // against Postgres for the "one-off in range OR recurring not-yet-ended" condition.
  const { data: events, error: eventsError } = await db
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  const allRows = (events ?? []) as EventRow[];
  const relevant = allRows.filter((e) => {
    const isRecurring = !!e.recurrence_days && e.recurrence_days.length > 0;
    if (!isRecurring) {
      return e.date >= start && e.date <= end;
    }
    if (e.date > end) return false; // recurrence hasn't started yet
    if (e.recurrence_end_date && e.recurrence_end_date < start) return false; // already ended
    return true;
  });

  const recurringIds = relevant
    .filter((e) => e.recurrence_days && e.recurrence_days.length > 0)
    .map((e) => e.id);

  let exceptions: EventExceptionRow[] = [];
  if (recurringIds.length > 0) {
    const { data: exData, error: exError } = await db
      .from("event_exceptions")
      .select("*")
      .in("parent_event_id", recurringIds)
      .gte("occurrence_date", start)
      .lte("occurrence_date", end);

    if (exError) {
      return NextResponse.json({ error: exError.message }, { status: 500 });
    }
    exceptions = (exData ?? []) as EventExceptionRow[];
  }

  const exceptionsByParent = new Map<string, EventExceptionRow[]>();
  for (const ex of exceptions) {
    const list = exceptionsByParent.get(ex.parent_event_id) ?? [];
    list.push(ex);
    exceptionsByParent.set(ex.parent_event_id, list);
  }

  const occurrences = expandAllEvents(relevant, exceptionsByParent, start, end);
  return NextResponse.json({ occurrences });
}

// POST /api/events — create a one-off or recurring event.
export async function POST(request: NextRequest) {
  const ctx = await getSupabaseUserClient();
  if (!ctx) return unauthorized();
  const db = ctx.supabase;
  let body: CreateEventInput;
  try {
    body = (await request.json()) as CreateEventInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.title?.trim() || !body.date) {
    return NextResponse.json({ error: "title and date are required" }, { status: 400 });
  }

  const recurrenceDays =
    body.recurrence_days && body.recurrence_days.length > 0 ? body.recurrence_days : null;

  const { data, error } = await db
    .from("events")
    .insert({
      title: body.title.trim(),
      date: body.date,
      start_time: body.start_time ?? null,
      end_time: body.end_time ?? null,
      notes: body.notes ?? null,
      recurrence_days: recurrenceDays,
      recurrence_end_date: recurrenceDays ? body.recurrence_end_date ?? null : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ event: data }, { status: 201 });
}