"use client";

import { useState } from "react";
import type { NoteFile, NoteFolder } from "@/lib/notes-types";
import { FILE_TITLE_MAX, FOLDER_TEXT_COLOR } from "@/lib/notes-types";
import Modal from "./modal";

/** Rename a file and/or move it to another course. */
export default function FileDialog({
  file,
  folders,
  onClose,
  onSave,
}: {
  file: NoteFile;
  folders: NoteFolder[];
  onClose: () => void;
  onSave: (changes: { title: string; folder_id: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState(file.title);
  const [folderId, setFolderId] = useState(file.folder_id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed = title.trim() !== file.title || folderId !== file.folder_id;
  const canSave = changed && title.trim() !== "" && !busy;

  async function save() {
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      await onSave({ title: title.trim(), folder_id: folderId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Edit file"
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl px-4 py-2 text-sm opacity-80 hover:opacity-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ color: FOLDER_TEXT_COLOR }}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-heading">Name</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={FILE_TITLE_MAX}
            className="rounded-xl border border-border bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <span className="text-xs opacity-60">Original file: {file.file_name}</span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-heading">Course</span>
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.icon} {f.name}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
