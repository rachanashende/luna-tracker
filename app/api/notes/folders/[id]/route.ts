import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  UUID_RE,
  badRequest,
  notFound,
  parseFolderInput,
  serverError,
} from "@/lib/notes-server";
import { NOTES_BUCKET } from "@/lib/notes-types";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const FOLDER_COLUMNS = "id, name, description, color, icon, created_at";

// GET /api/notes/folders/[id] — one course.
export async function GET(_request: Request, { params }: RouteContext) {
  const supabaseAdmin = getSupabaseServiceClient();
  const { id } = await params;
  if (!UUID_RE.test(id)) return badRequest("Invalid course id");

  const { data, error } = await supabaseAdmin
    .from("note_folders")
    .select(FOLDER_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) return serverError(error.message);
  if (!data) return notFound("Course not found");
  return NextResponse.json({ folder: data });
}

// PATCH /api/notes/folders/[id] — rename / recolour / change icon or description.
export async function PATCH(request: Request, { params }: RouteContext) {
  const supabaseAdmin = getSupabaseServiceClient();
  const { id } = await params;
  if (!UUID_RE.test(id)) return badRequest("Invalid course id");

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  const parsed = parseFolderInput(raw, "update");
  if (!parsed.ok) return badRequest(parsed.error);

  const { data, error } = await supabaseAdmin
    .from("note_folders")
    .update(parsed.value)
    .eq("id", id)
    .select(FOLDER_COLUMNS)
    .maybeSingle();

  if (error) return serverError(error.message);
  if (!data) return notFound("Course not found");
  return NextResponse.json({ folder: data });
}

// DELETE /api/notes/folders/[id] — delete a course AND every file in it.
// Storage objects are removed first; the DB rows go via ON DELETE CASCADE.
export async function DELETE(_request: Request, { params }: RouteContext) {
  const supabaseAdmin = getSupabaseServiceClient();
  const { id } = await params;
  if (!UUID_RE.test(id)) return badRequest("Invalid course id");

  const files = await supabaseAdmin
    .from("notes")
    .select("file_path")
    .eq("folder_id", id);
  if (files.error) return serverError(files.error.message);

  const paths = (files.data ?? [])
    .map((f) => f.file_path as string | null)
    .filter((p): p is string => !!p);

  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await supabaseAdmin.storage
      .from(NOTES_BUCKET)
      .remove(paths.slice(i, i + 100));
    if (error) return serverError(`Couldn't delete files: ${error.message}`);
  }

  const { data, error } = await supabaseAdmin
    .from("note_folders")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) return serverError(error.message);
  if (!data || data.length === 0) return notFound("Course not found");
  return NextResponse.json({ ok: true });
}
