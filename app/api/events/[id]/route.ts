// Module 3 — Calendar: edit + delete a single event or a single occurrence of a
// recurring event.
//
// Same import assumption as ../route.ts: `supabaseAdmin` is the service-role
// client exported from lib/supabase.ts — adjust that one import if your export
// name differs.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { DeleteEventInput, EventRow, UpdateEventInput } from "@/lib/events-types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/events/[id]
// Body: UpdateEventInput. `id` is always the master `events` row id.
// - One-off events: `scope` is ignored, the row is updated directly.
// - Recurring events, scope "all": updates the master row — affects every occurrence
//   that doesn't already have its own exception.
// - Recurring events, scope "this": upserts a row in `event_exceptions` keyed to
//   `occurrence_date`, leaving every other occurrence untouched.
//   (Known limitation: scope "this" can't move that single occurrence to a different
//   date, since the exception is keyed by its original date — only scope "all" can
//   change `date`. Fine for v1; flagged in MODULE_3_NOTES.md.)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  let body: UpdateEventInput;
  try {
    body = (await request.json()) as UpdateEventInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.occurrence_date) {
    return NextResponse.json({ error: "occurrence_date is required" }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: fetchError?.message ?? "Event not found" }, { status: 404 });
  }

  const event = existing as EventRow;
  const isRecurring = !!event.recurrence_days && event.recurrence_days.length > 0;

  if (!isRecurring || body.scope === "all") {
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.date !== undefined) updates.date = body.date;
    if (body.start_time !== undefined) updates.start_time = body.start_time;
    if (body.end_time !== undefined) updates.end_time = body.end_time;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.recurrence_days !== undefined) {
      updates.recurrence_days =
        body.recurrence_days && body.recurrence_days.length > 0 ? body.recurrence_days : null;
      // Dropping recurrence entirely should clear a stale end date too.
      if (!updates.recurrence_days) updates.recurrence_end_date = null;
    }
    if (body.recurrence_end_date !== undefined && updates.recurrence_end_date === undefined) {
      updates.recurrence_end_date = body.recurrence_end_date;
    }

    const { data, error } = await supabaseAdmin
      .from("events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ event: data });
  }

  // scope === "this" on a recurring event: upsert a per-occurrence exception.
  const exceptionPayload = {
    parent_event_id: id,
    occurrence_date: body.occurrence_date,
    is_cancelled: false,
    title: body.title !== undefined ? body.title.trim() : null,
    start_time: body.start_time !== undefined ? body.start_time : null,
    end_time: body.end_time !== undefined ? body.end_time : null,
    notes: body.notes !== undefined ? body.notes : null,
  };

  const { data, error } = await supabaseAdmin
    .from("event_exceptions")
    .upsert(exceptionPayload, { onConflict: "parent_event_id,occurrence_date" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exception: data });
}

// DELETE /api/events/[id]?occurrence_date=YYYY-MM-DD&scope=this|all
// One-off events, or scope "all": deletes the master row (cascades to its exceptions).
// Recurring events, scope "this": marks just that date cancelled via `event_exceptions`.
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const occurrenceDate = searchParams.get("occurrence_date");
  const scope = (searchParams.get("scope") ?? "all") as DeleteEventInput["scope"];

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: fetchError?.message ?? "Event not found" }, { status: 404 });
  }

  const event = existing as EventRow;
  const isRecurring = !!event.recurrence_days && event.recurrence_days.length > 0;

  if (!isRecurring || scope === "all") {
    const { error } = await supabaseAdmin.from("events").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true });
  }

  if (!occurrenceDate) {
    return NextResponse.json(
      { error: "occurrence_date is required to delete a single occurrence" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("event_exceptions").upsert(
    {
      parent_event_id: id,
      occurrence_date: occurrenceDate,
      is_cancelled: true,
    },
    { onConflict: "parent_event_id,occurrence_date" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true, occurrence_date: occurrenceDate });
}
