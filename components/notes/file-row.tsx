"use client";

import { formatBytes, kindForMime } from "@/lib/note-files";
import { formatDate } from "@/lib/notes-client";
import { FOLDER_TEXT_COLOR, type NoteFile } from "@/lib/notes-types";
import KebabMenu from "./kebab-menu";

/** One uploaded file, laid out like a Classroom "material" row. */
export default function FileRow({
  file,
  onRename,
  onDelete,
}: {
  file: NoteFile;
  onRename: (file: NoteFile) => void;
  onDelete: (file: NoteFile) => void;
}) {
  const kind = kindForMime(file.file_type);
  const openUrl = `/api/notes/${file.id}/file`;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition hover:shadow-sm">
      <a
        href={openUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
          style={{ backgroundColor: kind.color, color: FOLDER_TEXT_COLOR }}
        >
          {kind.label}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium text-heading">{file.title}</span>
          <span className="block truncate text-xs opacity-60">
            Uploaded {formatDate(file.created_at)} · {formatBytes(file.file_size)}
          </span>
        </span>
      </a>
      <KebabMenu
        label={`Options for ${file.title}`}
        items={[
          { label: "Open", onClick: () => window.open(openUrl, "_blank", "noopener") },
          {
            label: "Download",
            onClick: () => {
              const a = document.createElement("a");
              a.href = `${openUrl}?download=1`;
              a.download = file.file_name;
              document.body.appendChild(a);
              a.click();
              a.remove();
            },
          },
          { label: "Rename / move", onClick: () => onRename(file) },
          { label: "Delete", onClick: () => onDelete(file), danger: true },
        ]}
      />
    </div>
  );
}
