import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { parseEntryInput } from "@/lib/journal-server";

const err = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/journal/[id]  { date?, mood?, body? } */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const supabaseAdmin = getSupabaseServiceClient();
  const { id } = await params;
  const raw = await req.json().catch(() => null);
  const parsed = parseEntryInput(raw, "update");
  if (!parsed.ok) return err(parsed.error);

  const { data, error } = await supabaseAdmin
    .from("journal")
    .update({ ...parsed.value, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) return err(error.message, 500);
  if (!data) return err("Entry not found", 404);
  return NextResponse.json({ entry: data });
}

/** DELETE /api/journal/[id] */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const supabaseAdmin = getSupabaseServiceClient();
  const { id } = await params;
  const { error } = await supabaseAdmin.from("journal").delete().eq("id", id);
  if (error) return err(error.message, 500);
  return NextResponse.json({ ok: true });
}
