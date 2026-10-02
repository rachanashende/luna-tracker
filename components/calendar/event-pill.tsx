"use client";

// Module 3 — Calendar: a single event chip, used in both the month grid and week view.
//
// ASSUMPTION: reuses the four category-tag pastel utilities Module 1 set up
// (bg-tag-green / bg-tag-blue / bg-tag-yellow / bg-tag-pink — see BUILD_SPEC.md's
// palette table). Cycles through them deterministically by event id so the same
// event always gets the same color across renders/views.

import type { CalendarOccurrence } from "@/lib/events-types";
import { formatTimeLabel } from "@/lib/dates";

const TAG_CLASSES = ["bg-tag-pink", "bg-tag-blue", "bg-tag-yellow", "bg-tag-green"];

export function tagClassForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return TAG_CLASSES[hash % TAG_CLASSES.length];
}

interface EventPillProps {
  occurrence: CalendarOccurrence;
  onClick: () => void;
  compact?: boolean;
}

export function EventPill({ occurrence, onClick, compact }: EventPillProps) {
  const time = formatTimeLabel(occurrence.startTime);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`${tagClassForId(
        occurrence.parentId
      )} w-full truncate rounded-md px-1.5 py-0.5 text-left text-xs font-medium shadow-sm transition-opacity hover:opacity-80 ${
        compact ? "" : "mb-1"
      }`}
      // Inline color (not a Tailwind token) because the tag pastels are the same in
      // light and dark mode (per BUILD_SPEC.md), so the label always needs the dark
      // espresso ink for contrast, independent of whatever `text-*` tokens the theme
      // defines for surrounding UI.
      style={{ color: "#3D2B24" }}
      title={`${occurrence.title}${time ? ` · ${time}` : ""}`}
    >
      {time && <span className="mr-1 opacity-70">{time}</span>}
      {occurrence.title}
      {occurrence.isRecurring && <span className="ml-1 opacity-60">↻</span>}
    </button>
  );
}
