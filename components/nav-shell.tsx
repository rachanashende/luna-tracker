"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  NotebookPen,
  BookHeart,
  TimerReset,
  GraduationCap,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { logout } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/journal", label: "Journal", icon: BookHeart },
  { href: "/pomodoro", label: "Pomodoro", icon: TimerReset },
  { href: "/study", label: "Study", icon: GraduationCap },
];

export function NavShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-base">
            🌙
          </div>
          <span className="font-display text-lg font-semibold text-heading">
            Luna
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-accent text-heading"
                    : "text-foreground/80 hover:bg-highlight/50 hover:text-heading",
                ].join(" ")}
              >
                <Icon size={18} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <ThemeToggle />
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground/70 transition hover:bg-highlight/50 hover:text-heading"
            >
              <LogOut size={14} />
              Log out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm">
              🌙
            </div>
            <span className="font-display text-base font-semibold text-heading">
              Luna
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={logout}>
              <button
                type="submit"
                aria-label="Log out"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/70"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-4 pb-20 pt-6 md:px-8 md:pb-8 md:pt-8">
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-border bg-surface py-2 md:hidden">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-medium",
                  active ? "text-heading" : "text-foreground/60",
                ].join(" ")}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
