"use client";

import Link from "next/link";
import { FOLDER_TEXT_COLOR, type NoteFolder } from "@/lib/notes-types";
import KebabMenu from "./kebab-menu";

/** A course tile, modelled on a Google Classroom class card. */
export default function FolderCard({
  folder,
  onEdit,
  onDelete,
}: {
  folder: NoteFolder;
  onEdit: (folder: NoteFolder) => void;
  onDelete: (folder: NoteFolder) => void;
}) {
  const count = folder.file_count ?? 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface transition hover:shadow-md">
      <Link
        href={`/notes/${folder.id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div
          className="relative flex h-28 flex-col justify-end p-4"
          style={{ backgroundColor: folder.color, color: FOLDER_TEXT_COLOR }}
        >
          <p className="line-clamp-2 break-words pr-12 font-serif text-xl font-semibold leading-tight">
            {folder.name}
          </p>
          {folder.description && (
            <p className="mt-0.5 truncate pr-12 text-sm opacity-80">
              {folder.description}
            </p>
          )}
          <span
            aria-hidden
            className="absolute -bottom-5 right-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-surface bg-background text-3xl shadow-sm"
          >
            {folder.icon}
          </span>
        </div>
        <div className="h-24 px-4 pt-3 text-sm opacity-70">
          {count === 0 ? "No files yet" : `${count} file${count === 1 ? "" : "s"}`}
        </div>
      </Link>

      <KebabMenu
        className="absolute right-2 top-2 z-10"
        label={`Options for ${folder.name}`}
        items={[
          { label: "Customize", onClick: () => onEdit(folder) },
          { label: "Delete course", onClick: () => onDelete(folder), danger: true },
        ]}
      />
    </div>
  );
}
