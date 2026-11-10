"use client";

import { MOODS, TAG_BG, TAG_TEXT_COLOR } from "@/lib/journal-moods";

export function MoodPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (mood: string | null) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Mood" className="flex flex-wrap gap-2">
      {MOODS.map((m) => {
        const active = value === m.key;
        return (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? null : m.key)}
            style={active ? { color: TAG_TEXT_COLOR } : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              active
                ? `${TAG_BG[m.tag]} border-transparent font-medium`
                : "border-border bg-surface hover:bg-accent/30"
            }`}
          >
            <span aria-hidden="true">{m.emoji}</span>
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
