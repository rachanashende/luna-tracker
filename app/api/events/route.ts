// TODO(Module 3 — Calendar):
// CRUD for the `events` table (GET list/filter, POST create, PATCH update,
// DELETE). Use lib/supabase.ts's service client — never the browser client
// — since this runs server-side only.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Not implemented yet — built in Module 3." },
    { status: 501 }
  );
}
