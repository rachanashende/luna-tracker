import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { parseFolderInput, serverError } from "@/lib/notes-server";

export const dynamic = "force-dynamic";

// GET /api/notes/folders — all courses (oldest first) with a file count each.
export async function GET() {
  const supabaseAdmin = getSupabaseServiceClient();

  const [folders, files] = await Promise.all([
    supabaseAdmin
      .from("note_folders")
      .select("id, name, description, color, icon, created_at")
      .order("created_at", { ascending: true }),
    supabaseAdmin.from("notes").select("folder_id").not("folder_id", "is", null),
  ]);

  if (folders.error) return serverError(folders.error.message);
  if (files.error) return serverError(files.error.message);

  const counts = new Map<string, number>();
  for (const f of files.data ?? []) {
    counts.set(f.folder_id, (counts.get(f.folder_id) ?? 0) + 1);
  }

  return NextResponse.json({
    folders: (folders.data ?? []).map((f) => ({
      ...f,
      file_count: counts.get(f.id) ?? 0,
    })),
  });
}

// POST /api/notes/folders — create a course.
export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseServiceClient();

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = parseFolderInput(raw, "create");
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("note_folders")
    .insert(parsed.value)
    .select("id, name, description, color, icon, created_at")
    .single();

  if (error) return serverError(error.message);
  return NextResponse.json({ folder: { ...data, file_count: 0 } }, { status: 201 });
}
