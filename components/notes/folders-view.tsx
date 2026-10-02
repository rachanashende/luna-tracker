"use client";

import { useCallback, useEffect, useState } from "react";
import type { FolderInput, NoteFolder } from "@/lib/notes-types";
import { api, jsonInit } from "@/lib/notes-client";
import ConfirmDialog from "./confirm-dialog";
import FolderCard from "./folder-card";
import FolderDialog from "./folder-dialog";

type Dialog =
  | { kind: "none" }
  | { kind: "edit"; folder: NoteFolder | null }
  | { kind: "delete"; folder: NoteFolder };

/** /notes — the grid of courses. */
export default function FoldersView() {
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>({ kind: "none" });

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await api<{ folders: NoteFolder[] }>("/api/notes/folders");
      setFolders(data.folders);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Couldn't load your courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function saveFolder(input: FolderInput) {
    const editing = dialog.kind === "edit" ? dialog.folder : null;
    if (editing) {
      await api(`/api/notes/folders/${editing.id}`, jsonInit("PATCH", input));
    } else {
      await api("/api/notes/folders", jsonInit("POST", input));
    }
    setDialog({ kind: "none" });
    await load();
  }

  async function deleteFolder(folder: NoteFolder) {
    await api(`/api/notes/folders/${folder.id}`, { method: "DELETE" });
    setDialog({ kind: "none" });
    await load();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-heading">Notes</h1>
          <p className="text-sm opacity-70">
            {loading
              ? "Loading…"
              : folders.length === 0
                ? "Organise your notes by course"
                : `${folders.length} course${folders.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ kind: "edit", folder: null })}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold shadow-sm transition hover:brightness-95"
          style={{ color: "#3D2B24" }}
        >
          + New course
        </button>
      </header>

      {loadError && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-red-600 dark:text-red-400"
        >
          <span>{loadError}</span>
          <button type="button" onClick={load} className="rounded-lg px-3 py-1 font-medium underline">
            Retry
          </button>
        </div>
      )}

      {!loading && !loadError && folders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-4xl" aria-hidden>
            📚
          </p>
          <p className="mt-2 font-serif text-xl text-heading">No courses yet</p>
          <p className="mt-1 text-sm opacity-70">
            Create a course for each subject, then upload your notes into it.
          </p>
          <button
            type="button"
            onClick={() => setDialog({ kind: "edit", folder: null })}
            className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-semibold"
            style={{ color: "#3D2B24" }}
          >
            Create your first course
          </button>
        </div>
      )}

      {folders.length > 0 && (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((f) => (
            <li key={f.id}>
              <FolderCard
                folder={f}
                onEdit={(folder) => setDialog({ kind: "edit", folder })}
                onDelete={(folder) => setDialog({ kind: "delete", folder })}
              />
            </li>
          ))}
        </ul>
      )}

      {dialog.kind === "edit" && (
        <FolderDialog
          key={dialog.folder?.id ?? "new"}
          folder={dialog.folder}
          onClose={() => setDialog({ kind: "none" })}
          onSave={saveFolder}
        />
      )}
      {dialog.kind === "delete" && (
        <ConfirmDialog
          title="Delete course?"
          message={`“${dialog.folder.name}” and ${
            (dialog.folder.file_count ?? 0) > 0
              ? `its ${dialog.folder.file_count} uploaded file${dialog.folder.file_count === 1 ? "" : "s"}`
              : "everything in it"
          } will be permanently deleted. This can't be undone.`}
          confirmLabel="Delete course"
          onConfirm={() => deleteFolder(dialog.folder)}
          onClose={() => setDialog({ kind: "none" })}
        />
      )}
    </div>
  );
}
