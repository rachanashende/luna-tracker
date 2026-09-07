import {
  getDashboardStats,
  getDaySummary,
  getGreeting,
  getTodayEvents,
  getTodayLong,
  FOCUS_GOAL_MINUTES,
} from "@/lib/dashboard-data";
import { DashboardHero } from "@/components/dashboard/hero";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { FocusCard } from "@/components/dashboard/focus-card";
import { StatRow } from "@/components/dashboard/stat-row";
import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { NotebookText, GraduationCap, BookHeart } from "lucide-react";

export default async function DashboardPage() {
  const [events, stats] = await Promise.all([getTodayEvents(), getDashboardStats()]);

  const greeting = getGreeting();
  const today = getTodayLong();
  const summary = getDaySummary(stats, events.length);

  return (
    <div className="max-w-5xl">
      <DashboardHero greeting={greeting} today={today} summary={summary} />
      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TodaySchedule events={events} />
        </div>

        <div className="space-y-3">
          <FocusCard minutes={stats.focusMinutesToday} goalMinutes={FOCUS_GOAL_MINUTES} />
          <StatRow href="/notes" icon={NotebookText} label="Notes" value={String(stats.notesCount)} tag="green" />
          <StatRow href="/study" icon={GraduationCap} label="Subjects" value={String(stats.activeSubjects)} tag="blue" />
          <StatRow
            href="/journal"
            icon={BookHeart}
            label="Journal"
            value={stats.journalLoggedToday ? "Logged" : "Not yet"}
            tag="pink"
          />
        </div>
      </div>
    </div>
  );
}