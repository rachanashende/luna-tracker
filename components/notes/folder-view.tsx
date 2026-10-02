"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  ACCEPT_ATTR,
  MAX_FILE_BYTES,
  SUPPORTED_LABEL,
  kindForName,
  stripExt,
} from "@/lib/note-files";
import { api, jsonInit } from "@/lib/notes-client";
import {
  FOLDER_TEXT_COLOR,
  NOTES_BUCKET,
  type FolderInput,
  type NoteFile,
  type NoteFolder,
  type UploadUrlResponse,
} from "@/lib/notes-types";
import ConfirmDialog from "./confirm-dialog";
import FileDialog from "./file-dialog";
import FileRow from "./file-row";
import FolderDialog from "./folder-dialog";
import KebabMenu from "./kebab-menu";

interface UploadItem {
  key: number;
  name: string;
  status: "uploading" | "error";
  error?: string;
}

type Dialog =
  | { kind: "none" }
  | { kind: "editFolder" }
  | { kind: "deleteFolder" }
  | { kind: "editFile"; file: NoteFile }
  | { kind: "deleteFile"; file: NoteFile };

/** /notes/[folderId] — one course: banner, upload area, list of files. */
export default function FolderView({ folderId }: { folderId: string }) {
  const router = useRouter();
  const [folder, setFolder] = useState<NoteFolder | null>(null);
  const [allFolders, setAllFolders] = useState<NoteFolder[]>([]);
  const [files, setFiles] = useState<NoteFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [query, setQuery] = useState("");
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [dialog, setDialog] = useState<Dialog>({ kind: "none" });
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadKey = useRef(0);

  const loadFiles = useCallback(async () => {
    const data = await api<{ files: NoteFile[] }>(
      `/api/notes?folder_id=${folderId}`,
    );
    setFiles(data.files);
  }, [folderId]);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [f, all] = await Promise.all([
        api<{ folder: NoteFolder }>(`/api/notes/folders/${folderId}`),
        api<{ folders: NoteFolder[] }>("/api/notes/folders"),
      ]);
      setFolder(f.folder);
      setAllFolders(all.folders);
      await loadFiles();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't load this course";
      if (msg === "Course not found") setNotFound(true);
      else setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [folderId, loadFiles]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function uploadOne(file: File, key: number) {
    const kind = kindForName(file.name);
    const fail = (error: string) =>
      setUploads((u) =>
        u.map((x) => (x.key === key ? { ...x, status: "error", error } : x)),
      );

    if (!kind) return fail(`Unsupported type. Supported: ${SUPPORTED_LABEL}.`);
    if (file.size === 0) return fail("That file is empty.");
    if (file.size > MAX_FILE_BYTES) return fail("Files can be up to 50 MB.");

    try {
      // 1) ask the server for a signed upload slot
      const slot = await api<UploadUrlResponse>(
        "/api/notes/upload-url",
        jsonInit("POST", {
          folder_id: folderId,
          file_name: file.name,
          file_size: file.size,
        }),
      );
      // 2) send the bytes straight to storage
      const { error } = await getSupabaseBrowserClient()
        .storage.from(NOTES_BUCKET)
        .uploadToSignedUrl(slot.path, slot.token, file, {
          contentType: slot.content_type,
        });
      if (error) throw new Error(error.message);
      // 3) record it
      await api(
        "/api/notes",
        jsonInit("POST", {
          folder_id: folderId,
          path: slot.path,
          file_name: file.name,
          file_size: file.size,
          title: stripExt(file.name),
        }),
      );
      setUploads((u) => u.filter((x) => x.key !== key));
      await loadFiles();
    } catch (e) {
      fail(e instanceof Error ? e.message : "Upload failed");
    }
  }

  async function uploadFiles(list: File[]) {
    if (list.length === 0) return;
    const items = list.map((f) => ({
      key: ++uploadKey.current,
      name: f.name,
      status: "uploading" as const,
    }));
    setUploads((u) => [...u, ...items]);
    // sequential keeps things simple and gentle on mobile connections
    for (let i = 0; i < list.length; i++) {
      await uploadOne(list[i], items[i].key);
    }
    // refresh the count shown elsewhere (best effort)
    api<{ folders: NoteFolder[] }>("/api/notes/folders")
      .then((d) => setAllFolders(d.folders))
      .catch(() => {});
  }

  async function saveFolder(input: FolderInput) {
    const data = await api<{ folder: NoteFolder }>(
      `/api/notes/folders/${folderId}`,
      jsonInit("PATCH", input),
    );
    setFolder(data.folder);
    setDialog({ kind: "none" });
  }

  async function deleteFolder() {
    await api(`/api/notes/folders/${folderId}`, { method: "DELETE" });
    router.push("/notes");
  }

  async function saveFile(
    file: NoteFile,
    changes: { title: string; folder_id: string },
  ) {
    const body: { title?: string; folder_id?: string } = {};
    if (changes.title !== file.title) body.title = changes.title;
    if (changes.folder_id !== file.folder_id) body.folder_id = changes.folder_id;
    await api(`/api/notes/${file.id}`, jsonInit("PATCH", body));
    setDialog({ kind: "none" });
    await loadFiles();
  }

  async function deleteFile(file: NoteFile) {
    await api(`/api/notes/${file.id}`, { method: "DELETE" });
    setDialog({ kind: "none" });
    await loadFiles();
  }

  const visibleFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.file_name.toLowerCase().includes(q),
    );
  }, [files, query]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-serif text-2xl text-heading">Course not found</p>
        <p className="mt-1 text-sm opacity-70">It may have been deleted.</p>
        <Link href="/notes" className="mt-4 inline-block underline">
          Back to all courses
        </Link>
      </div>
    );
  }

  return (
    <div
      className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        uploadFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <Link href="/notes" className="mb-3 inline-block text-sm opacity-70 hover:opacity-100">
        ← All courses
      </Link>

      {/* Banner */}
      <div
        className="relative mb-6 flex min-h-36 items-end rounded-2xl p-5 sm:p-6"
        style={{
          backgroundColor: folder?.color ?? "var(--color-surface, #eee)",
          color: FOLDER_TEXT_COLOR,
        }}
      >
        <div className="min-w-0 pr-16">
          <h1 className="break-words font-serif text-3xl font-semibold leading-tight">
            {folder?.name ?? (loading ? "Loading…" : "")}
          </h1>
          {folder?.description && (
            <p className="mt-1 text-base opacity-80">{folder.description}</p>
          )}
        </div>
        {folder && (
          <>
            <span
              aria-hidden
              className="absolute bottom-4 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-background text-3xl shadow-sm"
            >
              {folder.icon}
            </span>
            <KebabMenu
              className="absolute right-2 top-2"
              label="Course options"
              items={[
                { label: "Customize", onClick: () => setDialog({ kind: "editFolder" }) },
                {
                  label: "Delete course",
                  onClick: () => setDialog({ kind: "deleteFolder" }),
                  danger: true,
                },
              ]}
            />
          </>
        )}
      </div>

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

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!folder}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold shadow-sm transition hover:brightness-95 disabled:opacity-50"
          style={{ color: FOLDER_TEXT_COLOR }}
        >
          ⬆ Upload notes
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => {
            uploadFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        {files.length > 0 && (
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this course…"
            aria-label="Search files in this course"
            className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 py-2 text-sm placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent sm:max-w-xs"
          />
        )}
      </div>

      {/* Upload queue */}
      {uploads.length > 0 && (
        <ul className="mb-4 flex flex-col gap-2">
          {uploads.map((u) => (
            <li
              key={u.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
            >
              <span className="min-w-0">
                <span className="block truncate">{u.name}</span>
                {u.status === "error" && (
                  <span className="block text-xs text-red-600 dark:text-red-400">
                    {u.error}
                  </span>
                )}
              </span>
              {u.status === "uploading" ? (
                <span className="shrink-0 text-xs opacity-70">Uploading…</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setUploads((x) => x.filter((i) => i.key !== u.key))}
                  className="shrink-0 text-xs underline"
                >
                  Dismiss
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Files / empty state / drop target */}
      {!loading && !loadError && files.length === 0 && uploads.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex w-full flex-col items-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition ${
            dragging ? "border-heading bg-accent/20" : "border-border"
          }`}
        >
          <span className="text-4xl" aria-hidden>
            ⬆️
          </span>
          <span className="mt-2 font-serif text-xl text-heading">
            Drop your notes here
          </span>
          <span className="mt-1 text-sm opacity-70">
            or click to choose files · {SUPPORTED_LABEL} · up to 50 MB each
          </span>
        </button>
      )}

      {visibleFiles.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {visibleFiles.map((f) => (
            <FileRow
              key={f.id}
              file={f}
              onRename={(file) => setDialog({ kind: "editFile", file })}
              onDelete={(file) => setDialog({ kind: "deleteFile", file })}
            />
          ))}
        </div>
      )}

      {files.length > 0 && visibleFiles.length === 0 && (
        <p className="py-10 text-center text-sm opacity-70">
          No files match “{query.trim()}”.
        </p>
      )}

      {dragging && files.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <p className="rounded-2xl bg-background px-6 py-4 font-serif text-xl text-heading shadow-lg">
            Drop to upload to {folder?.name ?? "this course"}
          </p>
        </div>
      )}

      {dialog.kind === "editFolder" && folder && (
        <FolderDialog
          folder={folder}
          onClose={() => setDialog({ kind: "none" })}
          onSave={saveFolder}
        />
      )}
      {dialog.kind === "deleteFolder" && folder && (
        <ConfirmDialog
          title="Delete course?"
          message={`“${folder.name}” and all ${files.length} uploaded file${files.length === 1 ? "" : "s"} in it will be permanently deleted. This can't be undone.`}
          confirmLabel="Delete course"
          onConfirm={deleteFolder}
          onClose={() => setDialog({ kind: "none" })}
        />
      )}
      {dialog.kind === "editFile" && (
        <FileDialog
          key={dialog.file.id}
          file={dialog.file}
          folders={allFolders}
          onClose={() => setDialog({ kind: "none" })}
          onSave={(changes) => saveFile(dialog.file, changes)}
        />
      )}
      {dialog.kind === "deleteFile" && (
        <ConfirmDialog
          title="Delete file?"
          message={`“${dialog.file.title}” will be permanently deleted. This can't be undone.`}
          onConfirm={() => deleteFile(dialog.file)}
          onClose={() => setDialog({ kind: "none" })}
        />
      )}
    </div>
  );
}
