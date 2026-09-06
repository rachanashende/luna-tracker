// TODO(Module 4 — Notes):
// CRUD for the `notes` table, plus a search query param across title+body.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Not implemented yet — built in Module 4." },
    { status: 501 }
  );
}
