import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  computeStreak,
  isValidDateStr,
  parseEntryInput,
} from "@/lib/journal-server";

const err = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

/**
 * GET /api/journal
 *   ?start=YYYY-MM-DD&end=YYYY-MM-DD   entries in a date range (inclusive)
 *   ?q=text                            search entry text (all time, max 100)
 *   ?stats=1&today=YYYY-MM-DD          { streak, total }
 */
export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseServiceClient();
  const sp = req.nextUrl.searchParams;

  if (sp.get("stats")) {
    const today = sp.get("today");
    if (!isValidDateStr(today)) return err("today must be YYYY-MM-DD");
    const { data, count, error } = await supabaseAdmin
      .from("journal")
      .select("date", { count: "exact" })
      .order("date", { ascending: false })
      .limit(1000);
    if (error) return err(error.message, 500);
    const dates = (data ?? []).map((r) => String(r.date));
    return NextResponse.json({
      streak: computeStreak(dates, today),
      total: count ?? dates.length,
    });
  }

  let query = supabaseAdmin
    .from("journal")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const start = sp.get("start");
  const end = sp.get("end");
  const q = sp.get("q")?.trim();

  if (start) {
    if (!isValidDateStr(start)) return err("start must be YYYY-MM-DD");
    query = query.gte("date", start);
  }
  if (end) {
    if (!isValidDateStr(end)) return err("end must be YYYY-MM-DD");
    query = query.lte("date", end);
  }
  if (q) {
    // Escape LIKE wildcards so the search is literal.
    const safe = q.slice(0, 100).replace(/[\\%_]/g, (c) => `\\${c}`);
    query = query.ilike("body", `%${safe}%`);
  }
  query = query.limit(q ? 100 : 500);

  const { data, error } = await query;
  if (error) return err(error.message, 500);
  return NextResponse.json({ entries: data ?? [] });
}

/** POST /api/journal  { date, mood?, body } */
export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseServiceClient();
  const raw = await req.json().catch(() => null);
  const parsed = parseEntryInput(raw, "create");
  if (!parsed.ok) return err(parsed.error);

  const { data, error } = await supabaseAdmin
    .from("journal")
    .insert({
      date: parsed.value.date,
      mood: parsed.value.mood ?? null,
      body: parsed.value.body,
    })
    .select()
    .single();
  if (error) return err(error.message, 500);
  return NextResponse.json({ entry: data }, { status: 201 });
}
