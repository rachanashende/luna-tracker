"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";

export function FocusCard({
  minutes,
  goalMinutes,
}: {
  minutes: number;
  goalMinutes: number;
}) {
  const targetPct = Math.min(100, Math.round((minutes / goalMinutes) * 100));
  const [pct, setPct] = useState(0);

  useEffect(() => {
    // One small orchestrated reveal on load — deliberately not repeated
    // per-card motion elsewhere on the page.
    const id = requestAnimationFrame(() => setPct(targetPct));
    return () => cancelAnimationFrame(id);
  }, [targetPct]);

  return (
    <Link
      href="/pomodoro"
      className="block rounded-xl border border-border bg-surface border-l-4 border-l-tag-yellow px-5 py-4 hover:border-accent transition-colors"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-body/70">Focus time today</p>
        <Flame size={16} className="text-tag-yellow" />
      </div>
      <p className="font-display text-3xl text-heading mt-1">
        {minutes} <span className="text-base font-sans text-body/60">/ {goalMinutes} min</span>
      </p>
      <div className="mt-3 h-1.5 rounded-full bg-background overflow-hidden">
        <div
          className="h-full rounded-full bg-tag-yellow transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}