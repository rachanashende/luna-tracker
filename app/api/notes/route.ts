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
  type RegisterFileRequest,
} from "@/lib/notes-types";
import { MAX_FILE_BYTES, kindForName, stripExt } from "@/lib/note-files";

export const dynamic = "force-dynamic";

// GET /api/notes?folder_id=<uuid> — files in one course, newest first.
export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseServiceClient();
  const folderId = new URL(request.url).searchParams.get("folder_id") ?? "";
  if (!UUID_RE.test(folderId)) return badRequest("folder_id is required");

  const { data, error } = await supabaseAdmin
    .from("notes")
    .select(NOTE_FILE_COLUMNS)
    .eq("folder_id", folderId)
    .not("file_path", "is", null)
    .order("created_at", { ascending: false });

  if (error) return serverError(error.message);
  return NextResponse.json({ files: data ?? [] });
}

// POST /api/notes — register a file that has ALREADY been uploaded to storage
// (via the signed URL from /api/notes/upload-url). Creates the `notes` row.
export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseServiceClient();

  let p: RegisterFileRequest;
  try {
    p = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (!UUID_RE.test(p.folder_id ?? "")) return badRequest("Invalid course id");
  if (typeof p.file_name !== "string" || !p.file_name.trim()) {
    return badRequest("file_name is required");
  }
  const kind = kindForName(p.file_name);
  if (!kind) return badRequest("That file type isn't supported");
  if (
    typeof p.file_size !== "number" ||
    !Number.isFinite(p.file_size) ||
    p.file_size < 0 ||
    p.file_size > MAX_FILE_BYTES
  ) {
    return badRequest("Invalid file size");
  }
  // The object key must be one this API issued for this course.
  if (typeof p.path !== "string" || !p.path.startsWith(`${p.folder_id}/`) || p.path.includes("..")) {
    return badRequest("Invalid file path");
  }

  const title = (typeof p.title === "string" ? p.title.trim() : "") || stripExt(p.file_name);
  if (title.length > FILE_TITLE_MAX) {
    return badRequest(`Title must be ${FILE_TITLE_MAX} characters or fewer`);
  }

  const folder = await supabaseAdmin
    .from("note_folders")
    .select("id")
    .eq("id", p.folder_id)
    .maybeSingle();
  if (folder.error) return serverError(folder.error.message);
  if (!folder.data) return notFound("Course not found");

  const { data, error } = await supabaseAdmin
    .from("notes")
    .insert({
      folder_id: p.folder_id,
      title,
      body: "",
      file_path: p.path,
      file_name: p.file_name.trim(),
      file_type: kind.mime,
      file_size: p.file_size,
    })
    .select(NOTE_FILE_COLUMNS)
    .single();

  if (error) {
    // Don't leave an orphaned object behind if the row couldn't be saved.
    await supabaseAdmin.storage.from(NOTES_BUCKET).remove([p.path]);
    return serverError(error.message);
  }
  return NextResponse.json({ file: data }, { status: 201 });
}
