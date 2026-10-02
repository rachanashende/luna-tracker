import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  UUID_RE,
  badRequest,
  notFound,
  serverError,
} from "@/lib/notes-server";
import { NOTES_BUCKET } from "@/lib/notes-types";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/notes/[id]/file          — open the file (PDFs/images show in the browser)
// GET /api/notes/[id]/file?download=1 — force a download with the original name
// Redirects to a short-lived signed URL; the bucket itself stays private.
export async function GET(request: Request, { params }: RouteContext) {
  const supabaseAdmin = getSupabaseServiceClient();
  const { id } = await params;
  if (!UUID_RE.test(id)) return badRequest("Invalid file id");

  const row = await supabaseAdmin
    .from("notes")
    .select("file_path, file_name")
    .eq("id", id)
    .maybeSingle();
  if (row.error) return serverError(row.error.message);
  if (!row.data?.file_path) return notFound("File not found");

  const download = new URL(request.url).searchParams.get("download") === "1";
  const { data, error } = await supabaseAdmin.storage
    .from(NOTES_BUCKET)
    .createSignedUrl(
      row.data.file_path,
      60,
      download ? { download: row.data.file_name ?? true } : undefined,
    );

  if (error || !data) {
    return serverError(error?.message ?? "Couldn't open the file");
  }
  return NextResponse.redirect(data.signedUrl);
}
