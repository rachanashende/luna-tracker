export function DashboardHero({
  greeting,
  today,
  summary,
}: {
  greeting: string;
  today: string;
  summary: string;
}) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-border bg-surface px-8 py-10 mb-6">
      {/* Ambient wash + a few faint points of light — quiet nod to the
          Luna/moon theme, not a literal illustration. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full bg-accent/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-6 right-28 w-40 h-40 rounded-full bg-highlight/40 blur-2xl"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="absolute top-8 right-16 w-1 h-1 rounded-full bg-highlight/80" />
        <span className="absolute top-20 right-44 w-1.5 h-1.5 rounded-full bg-highlight/60" />
        <span className="absolute top-14 right-64 w-1 h-1 rounded-full bg-highlight/50" />
      </div>

      <div className="relative">
        <h1 className="font-display text-4xl md:text-5xl text-heading">{greeting}</h1>
        <p className="text-body/70 mt-2">{today}</p>
        <p className="text-body/60 text-sm mt-4">{summary}</p>
      </div>
    </header>
  );
}