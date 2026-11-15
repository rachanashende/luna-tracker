import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserClient, unauthorized } from "@/lib/supabase-server";
import { parseEntryInput } from "@/lib/journal-server";

const err = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/journal/[id]  { date?, mood?, body? } */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const ctx = await getSupabaseUserClient();
  if (!ctx) return unauthorized();
  const db = ctx.supabase;
  const { id } = await params;
  const raw = await req.json().catch(() => null);
  const parsed = parseEntryInput(raw, "update");
  if (!parsed.ok) return err(parsed.error);

  const { data, error } = await db
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
  const ctx = await getSupabaseUserClient();
  if (!ctx) return unauthorized();
  const db = ctx.supabase;
  const { id } = await params;
  const { error } = await db.from("journal").delete().eq("id", id);
  if (error) return err(error.message, 500);
  return NextResponse.json({ ok: true });
}
