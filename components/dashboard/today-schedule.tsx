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
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="font-display text-xl text-heading">Today&apos;s schedule</h2>

      {events.length === 0 ? (
        <p className="text-sm text-body/70 mt-3">
          Nothing on the calendar today — once the calendar&apos;s built,
          your events will show up here automatically.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <div>
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