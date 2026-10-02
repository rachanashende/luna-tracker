import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  NOTE_BODY_MAX,
  NOTE_SEARCH_MAX,
  NOTE_TITLE_MAX,
  UNTITLED,
  type CreateNoteRequest,
} from "@/lib/notes-types";

export const dynamic = "force-dynamic";

/**
 * Build a PostgREST `or` filter value for a case-insensitive substring match.
 * The pattern is wrapped in double quotes so commas/parentheses in the user's
 * query can't break out of the filter; `%` `_` `\` are escaped so they match
 * literally instead of acting as wildcards.
 */
function ilikeValue(q: string): string {
  const escaped = q
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/"/g, '\\"');
  return `"%${escaped}%"`;
}

// GET /api/notes?q=search — newest-edited first; q matches title OR body.
export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseServiceClient();
  const q = (new URL(request.url).searchParams.get("q") ?? "")
    .trim()
    .slice(0, NOTE_SEARCH_MAX);

  let query = supabaseAdmin
    .from("notes")
    .select("id, title, body, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (q) {
    const v = ilikeValue(q);
    query = query.or(`title.ilike.${v},body.ilike.${v}`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ notes: data ?? [] });
}

// POST /api/notes — create a note.
export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseServiceClient();

  let payload: CreateNoteRequest;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const body = typeof payload.body === "string" ? payload.body : "";

  if (!title && !body.trim()) {
    return NextResponse.json(
      { error: "A note needs a title or some content" },
      { status: 400 },
    );
  }
  if (title.length > NOTE_TITLE_MAX) {
    return NextResponse.json(
      { error: `Title must be ${NOTE_TITLE_MAX} characters or fewer` },
      { status: 400 },
    );
  }
  if (body.length > NOTE_BODY_MAX) {
    return NextResponse.json(
      { error: `Note is too long (max ${NOTE_BODY_MAX} characters)` },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("notes")
    .insert({ title: title || UNTITLED, body })
    .select("id, title, body, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ note: data }, { status: 201 });
}
