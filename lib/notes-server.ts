// Server-side helpers shared by the notes API routes.
import { NextResponse } from "next/server";
import {
  DEFAULT_FOLDER_COLOR,
  DEFAULT_FOLDER_ICON,
  FOLDER_DESC_MAX,
  FOLDER_NAME_MAX,
} from "@/lib/notes-types";

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const HEX_RE = /^#[0-9a-f]{6}$/i;

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function notFound(message: string) {
  return NextResponse.json({ error: message }, { status: 404 });
}

/** Make a file name safe to use as part of a storage object key. */
export function safeObjectName(fileName: string): string {
  const cleaned = fileName.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+/, "");
  return (cleaned || "file").slice(-100);
}

type FolderFields = {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
};

/**
 * Validate folder input. For create, `name` is required and the other fields
 * get defaults; for update, only the fields that were sent are returned.
 */
export function parseFolderInput(
  raw: unknown,
  mode: "create" | "update",
): { ok: true; value: FolderFields } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "Invalid body" };
  }
  const r = raw as Record<string, unknown>;
  const out: FolderFields = {};

  if (r.name !== undefined || mode === "create") {
    if (typeof r.name !== "string" || !r.name.trim()) {
      return { ok: false, error: "Course name is required" };
    }
    const name = r.name.trim();
    if (name.length > FOLDER_NAME_MAX) {
      return { ok: false, error: `Name must be ${FOLDER_NAME_MAX} characters or fewer` };
    }
    out.name = name;
  }

  if (r.description !== undefined) {
    if (typeof r.description !== "string") {
      return { ok: false, error: "Invalid description" };
    }
    const d = r.description.trim();
    if (d.length > FOLDER_DESC_MAX) {
      return { ok: false, error: `Description must be ${FOLDER_DESC_MAX} characters or fewer` };
    }
    out.description = d;
  }

  if (r.color !== undefined) {
    if (typeof r.color !== "string" || !HEX_RE.test(r.color)) {
      return { ok: false, error: "Colour must be a hex value like #F7C8D2" };
    }
    out.color = r.color.toUpperCase();
  }

  if (r.icon !== undefined) {
    if (typeof r.icon !== "string" || !r.icon.trim() || r.icon.trim().length > 8) {
      return { ok: false, error: "Icon must be a short emoji" };
    }
    out.icon = r.icon.trim();
  }

  if (mode === "create") {
    out.description ??= "";
    out.color ??= DEFAULT_FOLDER_COLOR;
    out.icon ??= DEFAULT_FOLDER_ICON;
  } else if (Object.keys(out).length === 0) {
    return { ok: false, error: "Nothing to update" };
  }

  return { ok: true, value: out };
}
