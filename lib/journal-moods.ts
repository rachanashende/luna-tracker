export type TagColor = "green" | "blue" | "yellow" | "pink";

export const MOODS = [
  { key: "happy", label: "Happy", emoji: "😊", tag: "yellow" },
  { key: "calm", label: "Calm", emoji: "🌿", tag: "green" },
  { key: "grateful", label: "Grateful", emoji: "💗", tag: "pink" },
  { key: "focused", label: "Focused", emoji: "🎯", tag: "blue" },
  { key: "tired", label: "Tired", emoji: "😴", tag: "blue" },
  { key: "stressed", label: "Stressed", emoji: "😵‍💫", tag: "yellow" },
  { key: "low", label: "Low", emoji: "🌧️", tag: "pink" },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  emoji: string;
  tag: TagColor;
}>;

/** Must match the check constraint in supabase/004_journal.sql */
export const MOOD_KEYS: readonly string[] = MOODS.map((m) => m.key);

/** Literal class names so Tailwind's scanner picks them up. */
export const TAG_BG: Record<TagColor, string> = {
  green: "bg-tag-green",
  blue: "bg-tag-blue",
  yellow: "bg-tag-yellow",
  pink: "bg-tag-pink",
};

/** Pastel tags are the same in light and dark mode, so text uses a fixed dark. */
export const TAG_TEXT_COLOR = "#3D2B24";

export function getMood(key: string | null | undefined) {
  return MOODS.find((m) => m.key === key) ?? null;
}
