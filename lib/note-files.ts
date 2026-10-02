// Which files can be uploaded, how they're labelled, and size formatting.
// ALLOWED mime types here must match the `notes` storage bucket's
// allowed_mime_types (supabase/003_notes_folders_files.sql).

export const MAX_FILE_BYTES = 50 * 1024 * 1024; // matches the bucket limit

interface FileKind {
  mime: string;
  label: string; // short badge text
  color: string; // badge background (pastel)
}

const WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PPT = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const XLS = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const FILE_KINDS: Record<string, FileKind> = {
  pdf: { mime: "application/pdf", label: "PDF", color: "#F7C8D2" },
  doc: { mime: "application/msword", label: "DOC", color: "#B8D4F0" },
  docx: { mime: WORD, label: "DOC", color: "#B8D4F0" },
  ppt: { mime: "application/vnd.ms-powerpoint", label: "PPT", color: "#F9D3B4" },
  pptx: { mime: PPT, label: "PPT", color: "#F9D3B4" },
  xls: { mime: "application/vnd.ms-excel", label: "XLS", color: "#AEE1D6" },
  xlsx: { mime: XLS, label: "XLS", color: "#AEE1D6" },
  csv: { mime: "text/csv", label: "CSV", color: "#AEE1D6" },
  txt: { mime: "text/plain", label: "TXT", color: "#FBE7B2" },
  md: { mime: "text/markdown", label: "MD", color: "#FBE7B2" },
  png: { mime: "image/png", label: "IMG", color: "#D8CCF1" },
  jpg: { mime: "image/jpeg", label: "IMG", color: "#D8CCF1" },
  jpeg: { mime: "image/jpeg", label: "IMG", color: "#D8CCF1" },
  webp: { mime: "image/webp", label: "IMG", color: "#D8CCF1" },
  gif: { mime: "image/gif", label: "IMG", color: "#D8CCF1" },
};

export const ACCEPT_ATTR = Object.keys(FILE_KINDS)
  .map((e) => `.${e}`)
  .join(",");

export const SUPPORTED_LABEL = "PDF, Word, PowerPoint, Excel/CSV, text, images";

export function extOf(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i < 0 ? "" : fileName.slice(i + 1).toLowerCase();
}

export function kindForName(fileName: string): FileKind | null {
  return FILE_KINDS[extOf(fileName)] ?? null;
}

export function kindForMime(mime: string): FileKind {
  return (
    Object.values(FILE_KINDS).find((k) => k.mime === mime) ?? {
      mime,
      label: "FILE",
      color: "#E5E0DA",
    }
  );
}

export function stripExt(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i > 0 ? fileName.slice(0, i) : fileName;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
