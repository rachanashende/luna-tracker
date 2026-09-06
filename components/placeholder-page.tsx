type PlaceholderPageProps = {
  emoji: string;
  title: string;
  description: string;
  moduleLabel: string;
  tagColor: "green" | "blue" | "yellow" | "pink";
};

const TAG_CLASSES: Record<PlaceholderPageProps["tagColor"], string> = {
  green: "bg-tag-green",
  blue: "bg-tag-blue",
  yellow: "bg-tag-yellow",
  pink: "bg-tag-pink",
};

export function PlaceholderPage({
  emoji,
  title,
  description,
  moduleLabel,
  tagColor,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <span
        className={`mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium text-heading ${TAG_CLASSES[tagColor]}`}
      >
        {moduleLabel}
      </span>
      <div className="rounded-3xl border border-border bg-card p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-highlight text-2xl">
          {emoji}
        </div>
        <h1 className="font-display text-2xl font-semibold text-heading">
          {title}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-foreground/70">
          {description}
        </p>
      </div>
    </div>
  );
}
