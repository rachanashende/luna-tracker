// TODO(Module 6 — Pomodoro):
// Log sessions to `pomodoro_logs` (subject/freeform label, duration,
// timestamp) and return daily focus-time aggregates.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Not implemented yet — built in Module 6." },
    { status: 501 }
  );
}
