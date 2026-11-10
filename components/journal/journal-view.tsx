"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Flame, BookHeart, Search, X } from "lucide-react";
import { EntryForm } from "./entry-form";
import { EntryCard } from "./entry-card";
import { JournalCalendar } from "./journal-calendar";
import {
  createEntry,
  deleteEntry,
  fetchEntries,
  fetchStats,
  updateEntry,
} from "@/lib/journal-client";
import {
  dayOfYear,
  formatDayHeading,
  formatLongDate,
  formatMonthTitle,
  monthKey,
  monthRange,
  todayStr,
} from "@/lib/journal-dates";
import type { JournalEntry, JournalInput, JournalStats } from "@/lib/journal-types";

const PROMPTS = [
  "What's one thing that went better than expected today?",
  "What's taking up the most space in your head right now?",
  "Describe today in three words, then say why.",
  "What are you proud of this week, however small?",
  "What would make tomorrow feel like a good day?",
  "Who or what made you smile recently?",
  "What did you learn today — about anything?",
  "What do you need more of right now? Less of?",
  "Write about a small moment you don't want to forget.",
  "What's something you're looking forward to?",
  "What's been hard lately, and what's helping?",
  "If today had a colour, what would it be?",
  "What did you do just for yourself today?",
  "What's one thing you'd tell yourself a week ago?",
];

// Hydration-safe "today": empty string on the server, real local date on the client.
const noopSubscribe = () => () => {};

export function JournalView() {
  const today = useSyncExternalStore(noopSubscribe, todayStr, () => "");

  const [cursor, setCursor] = useState<{ y: number; m: number } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [monthData, setMonthData] = useState<{
    key: string;
    entries: JournalEntry[];
  } | null>(null);
  const [searchData, setSearchData] = useState<{
    q: string;
    entries: JournalEntry[];
  } | null>(null);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const view = cursor ?? (today ? { y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 } : null);
  const viewY = view?.y ?? -1;
  const viewM = view?.m ?? -1;
  const key = view ? monthKey(viewY, viewM) : "";
  const q = query.trim();
  const searching = q.length > 0;

  // Month entries (calendar dots + default list)
  useEffect(() => {
    if (viewY < 0) return;
    let cancelled = false;
    const { start, end } = monthRange(viewY, viewM);
    fetchEntries({ start, end })
      .then((entries) => {
        if (cancelled) return;
        setMonthData({ key: monthKey(viewY, viewM), entries });
        setLoadError(null);
      })
      .catch((e: Error) => !cancelled && setLoadError(e.message));
    return () => {
      cancelled = true;
    };
  }, [viewY, viewM, refreshKey]);

  // Streak + total
  useEffect(() => {
    if (!today) return;
    let cancelled = false;
    fetchStats(today)
      .then((s) => !cancelled && setStats(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [today, refreshKey]);

  // Search (debounced)
  useEffect(() => {
    if (!q) return;
    let cancelled = false;
    const t = setTimeout(() => {
      fetchEntries({ q })
        .then((entries) => !cancelled && setSearchData({ q, entries }))
        .catch((e: Error) => !cancelled && setLoadError(e.message));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, refreshKey]);

  const monthEntries = useMemo(
    () => (monthData?.key === key ? monthData.entries : []),
    [monthData, key],
  );
  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    for (const e of monthEntries) {
      const list = map.get(e.date);
      if (list) list.push(e);
      else map.set(e.date, [e]);
    }
    return map;
  }, [monthEntries]);

  const monthLoading = monthData?.key !== key;
  const searchLoading = searching && searchData?.q !== q;

  const listEntries = useMemo<JournalEntry[]>(() => {
    if (searching) return searchData?.q === q ? searchData.entries : [];
    if (selectedDate) return entriesByDate.get(selectedDate) ?? [];
    return monthEntries;
  }, [searching, searchData, q, selectedDate, entriesByDate, monthEntries]);

  const groups = useMemo(() => {
    const out: { date: string; entries: JournalEntry[] }[] = [];
    for (const e of listEntries) {
      const last = out[out.length - 1];
      if (last && last.date === e.date) last.entries.push(e);
      else out.push({ date: e.date, entries: [e] });
    }
    return out;
  }, [listEntries]);

  const loading = searching ? searchLoading : monthLoading;
  const composerDate = selectedDate ?? today;

  const refresh = () => setRefreshKey((k) => k + 1);

  async function handleCreate(input: JournalInput) {
    const entry = await createEntry(input);
    // Jump to the month the entry landed in; keep a day filter only if it still matches.
    setCursor({ y: Number(entry.date.slice(0, 4)), m: Number(entry.date.slice(5, 7)) - 1 });
    setSelectedDate((s) => (s === entry.date ? s : null));
    refresh();
  }

  async function handleUpdate(id: string, input: JournalInput) {
    await updateEntry(id, input);
    refresh();
  }

  async function handleDelete(id: string) {
    await deleteEntry(id);
    refresh();
  }

  function shiftMonth(delta: number) {
    const base = new Date(viewY, viewM + delta, 1);
    setCursor({ y: base.getFullYear(), m: base.getMonth() });
    setSelectedDate(null);
  }

  if (!today || !view) {
    return (
      <div className="mx-auto w-full max-w-6xl" aria-busy="true">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-surface motion-reduce:animate-none" />
        <div className="mt-6 h-72 animate-pulse rounded-2xl bg-surface motion-reduce:animate-none" />
      </div>
    );
  }

  const prompt = PROMPTS[dayOfYear(composerDate) % PROMPTS.length];
  const listTitle = searching
    ? `${listEntries.length}${listEntries.length === 100 ? "+" : ""} ${listEntries.length === 1 ? "result" : "results"} for “${q}”`
    : selectedDate
      ? formatLongDate(selectedDate)
      : formatMonthTitle(viewY, viewM);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl text-heading">Journal</h1>
        <p className="mt-1 text-sm opacity-70">
          A quiet place to check in with yourself.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Composer */}
        <section
          aria-label="New entry"
          className="rounded-2xl border border-border bg-surface p-4 sm:p-5 lg:col-start-1"
        >
          <h2 className="mb-4 font-display text-xl text-heading">
            {composerDate === today ? "How was today?" : formatLongDate(composerDate)}
          </h2>
          <EntryForm
            date={composerDate}
            maxDate={today}
            placeholder={prompt}
            submitLabel="Save entry"
            resetOnSuccess
            onSubmit={handleCreate}
          />
        </section>

        {/* Calendar + stats */}
        <aside className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              icon={<Flame size={18} />}
              value={stats ? String(stats.streak) : "–"}
              label={stats && stats.streak === 0 ? "Log today to start a streak" : "Day streak"}
            />
            <StatTile
              icon={<BookHeart size={18} />}
              value={stats ? String(stats.total) : "–"}
              label={stats?.total === 1 ? "Entry" : "Entries"}
            />
          </div>
          <JournalCalendar
            year={viewY}
            month={viewM}
            today={today}
            selected={selectedDate}
            entriesByDate={entriesByDate}
            onSelect={setSelectedDate}
            onPrev={() => shiftMonth(-1)}
            onNext={() => shiftMonth(1)}
            onToday={() => {
              setCursor(null);
              setSelectedDate(null);
            }}
          />
        </aside>

        {/* Entries */}
        <section aria-label="Entries" className="min-w-0 lg:col-start-1">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="mr-auto font-display text-xl text-heading">{listTitle}</h2>
            {selectedDate && !searching && (
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="rounded-full px-3 py-1 text-sm hover:bg-accent/30"
              >
                Show whole month
              </button>
            )}
            <div className="relative w-full sm:w-60">
              <Search
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search all entries"
                aria-label="Search entries"
                className="w-full rounded-full border border-border bg-surface py-2 pl-9 pr-8 text-sm placeholder:opacity-50"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 opacity-60 hover:opacity-100"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {loadError && (
            <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">
              Couldn’t load entries: {loadError}
            </p>
          )}

          {loading ? (
            <div className="space-y-3" aria-busy="true">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-2xl bg-surface motion-reduce:animate-none"
                />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <EmptyState searching={searching} selected={!!selectedDate} />
          ) : (
            <div className="space-y-6">
              {groups.map((g) => (
                <div key={g.date}>
                  <h3 className="mb-2 text-sm font-medium opacity-70">
                    {formatDayHeading(g.date, today)}
                  </h3>
                  <div className="space-y-3">
                    {g.entries.map((e) => (
                      <EntryCard
                        key={e.id}
                        entry={e}
                        maxDate={today}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3.5">
      <div className="flex items-center gap-2 opacity-70">{icon}</div>
      <p className="mt-1.5 font-display text-2xl text-heading">{value}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  );
}

function EmptyState({ searching, selected }: { searching: boolean; selected: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
      <p className="text-3xl" aria-hidden="true">
        🌙
      </p>
      <p className="mt-2 font-display text-lg text-heading">
        {searching
          ? "Nothing matches that search"
          : selected
            ? "No entries on this day"
            : "No entries this month yet"}
      </p>
      <p className="mt-1 text-sm opacity-70">
        {searching
          ? "Try a different word."
          : "Write a few lines above — it only takes a minute."}
      </p>
    </div>
  );
}
