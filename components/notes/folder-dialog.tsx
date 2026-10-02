"use client";

import { useState } from "react";
import {
  DEFAULT_FOLDER_COLOR,
  DEFAULT_FOLDER_ICON,
  FOLDER_COLORS,
  FOLDER_DESC_MAX,
  FOLDER_ICONS,
  FOLDER_NAME_MAX,
  FOLDER_TEXT_COLOR,
  type FolderInput,
  type NoteFolder,
} from "@/lib/notes-types";
import Modal from "./modal";

/** Create a course, or customise an existing one (name, subject line, colour, icon). */
export default function FolderDialog({
  folder,
  onClose,
  onSave,
}: {
  folder: NoteFolder | null; // null = new course
  onClose: () => void;
  onSave: (input: FolderInput) => Promise<void>;
}) {
  const [name, setName] = useState(folder?.name ?? "");
  const [description, setDescription] = useState(folder?.description ?? "");
  const [color, setColor] = useState<string>(folder?.color ?? DEFAULT_FOLDER_COLOR);
  const [icon, setIcon] = useState<string>(folder?.icon ?? DEFAULT_FOLDER_ICON);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim() !== "" && !busy;

  async function save() {
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      await onSave({ name, description, color, icon });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <Modal
      title={folder ? "Customize course" : "New course"}
      onClose={busy ? () => {} : onClose}
      wide
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
            {busy ? "Saving…" : folder ? "Save" : "Create"}
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
        {/* Live preview, same look as the course card banner */}
        <div
          className="relative flex h-24 items-end rounded-xl p-4"
          style={{ backgroundColor: color, color: FOLDER_TEXT_COLOR }}
        >
          <div className="min-w-0 pr-14">
            <p className="truncate font-serif text-xl font-semibold">
              {name.trim() || "Course name"}
            </p>
            <p className="truncate text-sm opacity-80">
              {description.trim() || "Section or subject"}
            </p>
          </div>
          <span
            aria-hidden
            className="absolute -bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-surface text-2xl shadow-sm"
          >
            {icon}
          </span>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-heading">Course name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={FOLDER_NAME_MAX}
            placeholder="e.g. Data Structures"
            className="rounded-xl border border-border bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-heading">Section / subject (optional)</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={FOLDER_DESC_MAX}
            placeholder="e.g. Semester 3 · CS201"
            className="rounded-xl border border-border bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1 font-medium text-heading">Colour</legend>
          <div className="flex flex-wrap gap-2">
            {FOLDER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Colour ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full border-2 transition ${
                  color === c ? "scale-110 border-heading" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1 font-medium text-heading">Icon</legend>
          <div className="flex flex-wrap gap-2">
            {FOLDER_ICONS.map((i) => (
              <button
                key={i}
                type="button"
                aria-label={`Icon ${i}`}
                aria-pressed={icon === i}
                onClick={() => setIcon(i)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition ${
                  icon === i
                    ? "border-heading bg-accent/40"
                    : "border-border bg-surface hover:bg-accent/20"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {/* Enter-to-submit support */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
