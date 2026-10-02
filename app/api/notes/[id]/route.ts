import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  NOTE_BODY_MAX,
  NOTE_TITLE_MAX,
  UNTITLED,
  type UpdateNoteRequest,
} from "@/lib/notes-types";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/notes/[id] — update title and/or body. The `notes` table has no
// updated_at trigger, so we stamp it here.
export async function PATCH(request: Request, { params }: RouteContext) {
  const supabaseAdmin = getSupabaseServiceClient();
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
  }

  let payload: UpdateNoteRequest;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const update: { title?: string; body?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (payload.title !== undefined) {
    if (typeof payload.title !== "string") {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }
    const title = payload.title.trim();
    if (title.length > NOTE_TITLE_MAX) {
      return NextResponse.json(
        { error: `Title must be ${NOTE_TITLE_MAX} characters or fewer` },
        { status: 400 },
      );
    }
    update.title = title || UNTITLED;
  }

  if (payload.body !== undefined) {
    if (typeof payload.body !== "string") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    if (payload.body.length > NOTE_BODY_MAX) {
      return NextResponse.json(
        { error: `Note is too long (max ${NOTE_BODY_MAX} characters)` },
        { status: 400 },
      );
    }
    update.body = payload.body;
  }

  if (update.title === undefined && update.body === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("notes")
    .update(update)
    .eq("id", id)
    .select("id, title, body, created_at, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }
  return NextResponse.json({ note: data });
}

// DELETE /api/notes/[id]
export async function DELETE(_request: Request, { params }: RouteContext) {
  const supabaseAdmin = getSupabaseServiceClient();
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("notes")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
