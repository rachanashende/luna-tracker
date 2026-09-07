import Link from "next/link";
import { Plus } from "lucide-react";
import type { TodayEvent } from "@/lib/dashboard-data";

function formatTime(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${period}`;
}

export function TodaySchedule({ events }: { events: TodayEvent[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 h-full">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-heading">Today&apos;s schedule</h2>
        <Link
          href="/calendar"
          className="flex items-center gap-1 text-xs text-body/60 hover:text-accent transition-colors"
        >
          <Plus size={14} /> Add event
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-body/70 mt-3">
          Nothing on the calendar today — once the calendar&apos;s built, your
          events will show up here automatically.
        </p>
      ) : (
        <ul className="mt-5 relative border-l border-border pl-5 space-y-5">
          {events.map((event) => (
            <li key={event.id} className="relative group">
              <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-accent ring-4 ring-surface" />
              <div className="rounded-lg -mx-2 px-2 py-1 group-hover:bg-background transition-colors">
                <p className="text-heading text-sm font-medium">{event.title}</p>
                {event.start_time && (
                  <p className="text-body/60 text-xs">
                    {formatTime(event.start_time)}
                    {event.end_time ? ` – ${formatTime(event.end_time)}` : ""}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}