// TODO(Module 7 — Study Tracker + AI Study Planner):
// Parse the syllabus (typed text or uploaded PDF), call lib/gemini.ts with
// syllabus + confidence + exam date + target grade, and save the resulting
// plan into `study_plan`. Gemini key stays server-side only.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Not implemented yet — built in Module 7." },
    { status: 501 }
  );
}
