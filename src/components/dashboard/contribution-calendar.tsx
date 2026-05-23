"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { DailyActivity } from "@/types/dashboard";

interface ContributionCalendarProps {
  data: DailyActivity[];
}

function level(count: number) {
  if (count === 0) return "bg-zinc-900 border-zinc-800/80";
  if (count <= 3) return "bg-cyan-950 border-cyan-900/50";
  if (count <= 8) return "bg-cyan-800/60 border-cyan-700/50";
  if (count <= 15) return "bg-cyan-600/70 border-cyan-500/50";
  return "bg-cyan-400/80 border-cyan-300/50";
}

export function ContributionCalendar({ data }: ContributionCalendarProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  const { weeks, byDate } = useMemo(() => {
    const map = new Map(data.map((d) => [d.date, d]));
    const end = new Date();
    const start = new Date(end);
    start.setMonth(start.getMonth() - 11);
    start.setDate(1);

    const days: { date: string; activity: DailyActivity | null }[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10);
      days.push({ date: key, activity: map.get(key) ?? null });
      cur.setDate(cur.getDate() + 1);
    }

    const pad = start.getDay();
    for (let i = 0; i < pad; i++) {
      days.unshift({ date: "", activity: null });
    }

    const w: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      w.push(days.slice(i, i + 7));
    }

    return { weeks: w, byDate: map };
  }, [data]);

  function formatTip(date: string, activity: DailyActivity | null) {
    if (!date) return "";
    const d = new Date(date + "T12:00:00");
    const label = d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
    const n = activity?.total ?? 0;
    if (n === 0) return `No questions on ${label}`;
    return `${n} question${n !== 1 ? "s" : ""} solved on ${label}`;
  }

  return (
    <div className="space-y-3">
      {tooltip && (
        <p className="text-xs text-cyan-300/90 animate-fade-in">{tooltip}</p>
      )}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={`${wi}-${di}`}
                className={cn(
                  "h-3 w-3 rounded-sm border transition-colors",
                  day.date ? level(day.activity?.total ?? 0) : "bg-transparent border-transparent",
                )}
                onMouseEnter={() =>
                  day.date && setTooltip(formatTip(day.date, day.activity))
                }
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span>Less</span>
        {[0, 3, 8, 15, 20].map((n, i) => (
          <div
            key={i}
            className={cn("h-3 w-3 rounded-sm border", level(n + 1))}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
