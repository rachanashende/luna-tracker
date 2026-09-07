type Tag = "green" | "blue" | "yellow" | "pink";

type StatCardProps = {
  label: string;
  value: string;
  tag: Tag;
  hint?: string;
};

// ASSUMPTION: MODULE_1_NOTES.md confirms bg-tag-green exists as a Tailwind
// utility, so I'm assuming its siblings (tag-blue/yellow/pink) follow the
// same naming for the border-left accent below.
const tagBorder: Record<Tag, string> = {
  green: "border-l-tag-green",
  blue: "border-l-tag-blue",
  yellow: "border-l-tag-yellow",
  pink: "border-l-tag-pink",
};

export function StatCard({ label, value, tag, hint }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface border-l-4 ${tagBorder[tag]} px-5 py-4`}
    >
      <p className="text-sm text-body/70">{label}</p>
      <p className="font-display text-3xl text-heading mt-1">{value}</p>
      {hint && <p className="text-xs text-body/60 mt-1">{hint}</p>}
    </div>
  );
}