// TODO(Module 5 — Journal):
// CRUD for the `journal` table (date, mood, body).
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Not implemented yet — built in Module 5." },
    { status: 501 }
  );
}
