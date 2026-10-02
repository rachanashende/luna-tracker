import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  UUID_RE,
  badRequest,
  notFound,
  serverError,
} from "@/lib/notes-server";
import {
  FILE_TITLE_MAX,
  NOTES_BUCKET,
  NOTE_FILE_COLUMNS,
  type UpdateFileRequest,
} from "@/lib/notes-types";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/notes/[id] — rename a file and/or move it to another course.
export async function PATCH(request: Request, { params }: RouteContext) {
  const supabaseAdmin = getSupabaseServiceClient();
  const { id } = await params;
  if (!UUID_RE.test(id)) return badRequest("Invalid file id");

  let p: UpdateFileRequest;
  try {
    p = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const update: { title?: string; folder_id?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (p.title !== undefined) {
    if (typeof p.title !== "string" || !p.title.trim()) {
      return badRequest("Name can't be empty");
    }
    if (p.title.trim().length > FILE_TITLE_MAX) {
      return badRequest(`Name must be ${FILE_TITLE_MAX} characters or fewer`);
    }
    update.title = p.title.trim();
  }

  if (p.folder_id !== undefined) {
    if (!UUID_RE.test(p.folder_id)) return badRequest("Invalid course id");
    const folder = await supabaseAdmin
      .from("note_folders")
      .select("id")
      .eq("id", p.folder_id)
      .maybeSingle();
    if (folder.error) return serverError(folder.error.message);
    if (!folder.data) return notFound("Course not found");
    update.folder_id = p.folder_id;
  }

  if (update.title === undefined && update.folder_id === undefined) {
    return badRequest("Nothing to update");
  }

  const { data, error } = await supabaseAdmin
    .from("notes")
    .update(update)
    .eq("id", id)
    .select(NOTE_FILE_COLUMNS)
    .maybeSingle();

  if (error) return serverError(error.message);
  if (!data) return notFound("File not found");
  return NextResponse.json({ file: data });
}

// DELETE /api/notes/[id] — remove the stored file, then its row.
export async function DELETE(_request: Request, { params }: RouteContext) {
  const supabaseAdmin = getSupabaseServiceClient();
  const { id } = await params;
  if (!UUID_RE.test(id)) return badRequest("Invalid file id");

  const row = await supabaseAdmin
    .from("notes")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();
  if (row.error) return serverError(row.error.message);
  if (!row.data) return notFound("File not found");

  if (row.data.file_path) {
    const { error } = await supabaseAdmin.storage
      .from(NOTES_BUCKET)
      .remove([row.data.file_path]);
    if (error) return serverError(`Couldn't delete the file: ${error.message}`);
  }

  const { error } = await supabaseAdmin.from("notes").delete().eq("id", id);
  if (error) return serverError(error.message);
  return NextResponse.json({ ok: true });
}
