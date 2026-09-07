import Link from "next/link";
import { NotebookPen, CalendarPlus, Timer, Smile } from "lucide-react";

const actions = [
  { label: "New note", href: "/notes", icon: NotebookPen },
  { label: "New event", href: "/calendar", icon: CalendarPlus },
  { label: "Start focus", href: "/pomodoro", icon: Timer },
  { label: "Log mood", href: "/journal", icon: Smile },
];

export function QuickActions() {
  return (
    <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
      {actions.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2 shrink-0 rounded-full border border-border bg-surface px-4 py-2 text-sm text-heading hover:border-accent hover:bg-accent/10 transition-colors"
        >
          <Icon size={16} className="text-body/70" />
          {label}
        </Link>
      ))}
    </div>
  );
}