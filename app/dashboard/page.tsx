import {
  getDashboardStats,
  getGreeting,
  getTodayEvents,
  getTodayLong,
} from "@/lib/dashboard-data";
import { StatCard } from "@/components/dashboard/stat-card";
import { TodaySchedule } from "@/components/dashboard/today-schedule";

export default async function DashboardPage() {
  const [events, stats] = await Promise.all([getTodayEvents(), getDashboardStats()]);

  const greeting = getGreeting();
  const today = getTodayLong();

  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl text-heading">{greeting}</h1>
        <p className="text-body/70 mt-2">{today}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard label="Notes" value={String(stats.notesCount)} tag="green" />
        <StatCard
          label="Subjects in progress"
          value={String(stats.activeSubjects)}
          tag="blue"
        />
        <StatCard
          label="Focus time today"
          value={stats.focusMinutesToday > 0 ? `${stats.focusMinutesToday} min` : "0 min"}
          tag="yellow"
        />
        <StatCard
          label="Journal"
          value={stats.journalLoggedToday ? "Logged" : "Not yet"}
          tag="pink"
          hint={stats.journalLoggedToday ? undefined : "No entry logged today"}
        />
      </div>

      <TodaySchedule events={events} />
    </div>
  );
}