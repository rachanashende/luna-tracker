import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  UUID_RE,
  badRequest,
  notFound,
  safeObjectName,
  serverError,
} from "@/lib/notes-server";
import {
  NOTES_BUCKET,
  type UploadUrlRequest,
  type UploadUrlResponse,
} from "@/lib/notes-types";
import { MAX_FILE_BYTES, kindForName } from "@/lib/note-files";

export const dynamic = "force-dynamic";

// POST /api/notes/upload-url — step 1 of an upload. Validates the file and
// returns a one-time signed URL token so the browser can send the bytes
// straight to Supabase Storage (this keeps big files off the Vercel function,
// which caps request bodies at ~4.5 MB).
export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseServiceClient();

  let p: UploadUrlRequest;
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
  if (typeof p.file_size !== "number" || !(p.file_size > 0)) {
    return badRequest("That file is empty");
  }
  if (p.file_size > MAX_FILE_BYTES) {
    return badRequest("Files can be up to 50 MB");
  }

  const folder = await supabaseAdmin
    .from("note_folders")
    .select("id")
    .eq("id", p.folder_id)
    .maybeSingle();
  if (folder.error) return serverError(folder.error.message);
  if (!folder.data) return notFound("Course not found");

  const path = `${p.folder_id}/${crypto.randomUUID()}-${safeObjectName(p.file_name)}`;
  const { data, error } = await supabaseAdmin.storage
    .from(NOTES_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return serverError(error?.message ?? "Couldn't start the upload");
  }

  const body: UploadUrlResponse = {
    path: data.path,
    token: data.token,
    content_type: kind.mime,
  };
  return NextResponse.json(body);
}
