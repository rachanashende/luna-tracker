import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

type Tag = "green" | "blue" | "pink";

const dotColor: Record<Tag, string> = {
  green: "bg-tag-green",
  blue: "bg-tag-blue",
  pink: "bg-tag-pink",
};

export function StatRow({
  href,
  icon: Icon,
  label,
  value,
  tag,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  value: string;
  tag: Tag;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 hover:border-accent transition-colors group"
    >
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${dotColor[tag]}`} />
        <Icon size={16} className="text-body/60" />
        <span className="text-sm text-heading">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-body/70">{value}</span>
        <ArrowRight
          size={14}
          className="text-body/40 group-hover:translate-x-0.5 group-hover:text-accent transition-transform"
        />
      </div>
    </Link>
  );
}