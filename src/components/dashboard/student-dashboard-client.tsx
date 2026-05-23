"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Atom,
  BookMarked,
  Calculator,
  Compass,
  Flame,
  HelpCircle,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { ContributionCalendar } from "@/components/dashboard/contribution-calendar";
import type { DashboardOverview } from "@/types/dashboard";

const SUBJECT_ICONS: Record<string, typeof Atom> = {
  physics: Atom,
  chemistry: Sparkles,
  mathematics: Calculator,
};

const SUBJECT_GRADIENTS: Record<string, string> = {
  physics: "from-violet-600/20 to-cyan-950/40 border-violet-500/25",
  chemistry: "from-emerald-600/20 to-cyan-950/40 border-emerald-500/25",
  mathematics: "from-amber-600/20 to-cyan-950/40 border-amber-500/25",
};

interface StudentDashboardClientProps {
  userName: string;
}

export function StudentDashboardClient({ userName }: StudentDashboardClientProps) {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/student/dashboard", { cache: "no-store", credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOverview(data.overview);
        else setError(data.error ?? "Failed to load");
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load dashboard");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-500 animate-pulse-soft">
        Loading your dashboard...
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-6 text-red-200">
        {error ?? "Unable to load dashboard"}
      </div>
    );
  }

  const { pending } = overview;

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-zinc-900/80 to-zinc-950 p-8">
        <p className="mb-2 flex items-center gap-2 text-sm text-cyan-300">
          <Sparkles className="h-4 w-4" />
          Student Hub
        </p>
        <h1 className="text-3xl font-bold text-white">
          Hello, {userName}
        </h1>
        <p className="mt-2 max-w-xl text-zinc-400">
          Track PCM progress, fix mistakes, clear doubts, and build your daily streak.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/student/explorer">
              <Compass className="h-4 w-4" />
              Explorer
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/student/practice">Practice</Link>
          </Button>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Pending actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: "Doubts pending",
              value: pending.doubts_pending,
              href: "/student/doubts",
              icon: HelpCircle,
              color: "text-amber-400",
            },
            {
              label: "Mistakes to fix",
              value: pending.mistakes_pending,
              href: "/student/mistakes",
              icon: AlertTriangle,
              color: "text-red-400",
            },
            {
              label: "Revision queue",
              value: pending.revision_pending,
              href: "/student/revision",
              icon: BookMarked,
              color: "text-fuchsia-400",
            },
            {
              label: "Today solved",
              value: pending.today_solved,
              href: "/student/practice",
              icon: Target,
              color: "text-cyan-400",
            },
            {
              label: "Current streak",
              value: `${pending.streak} day${pending.streak !== 1 ? "s" : ""}`,
              href: "/student/dashboard",
              icon: Flame,
              color: "text-orange-400",
            },
          ].map(({ label, value, href, icon: Icon, color }) => (
            <Link
              key={label}
              href={href}
              className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4 transition-all hover:border-cyan-500/30 hover:bg-zinc-900/80"
            >
              <Icon className={`mb-2 h-5 w-5 ${color}`} />
              <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{value}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Available", value: overview.total_questions, icon: Target },
          { label: "Attempted", value: overview.attempted, icon: TrendingUp },
          {
            label: "Mastery",
            value: `${overview.mastery_percent}%`,
            icon: Sparkles,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5"
          >
            <Icon className="mb-3 h-5 w-5 text-cyan-400" />
            <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">PCM subjects</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {overview.subjects.map((sub) => {
            const Icon = SUBJECT_ICONS[sub.slug] ?? Atom;
            const gradient =
              SUBJECT_GRADIENTS[sub.slug] ??
              "from-zinc-800/40 to-zinc-950 border-zinc-700/50";
            return (
              <Link
                key={sub.id}
                href={`/student/subject/${sub.slug}`}
                className={`group rounded-2xl border bg-gradient-to-br p-6 transition-all hover:scale-[1.02] ${gradient}`}
              >
                <div className="flex items-start justify-between">
                  <Icon className="h-8 w-8 text-cyan-400" />
                  <ProgressRing
                    value={sub.mastery_percent}
                    size={56}
                    stroke={5}
                    accent="stroke-cyan-400"
                  />
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">{sub.name}</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {sub.chapters_count} chapters · {sub.attempted}/{sub.total_questions} attempted
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {overview.weak_chapters.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Weak chapters</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overview.weak_chapters.map((ch) => (
              <Link
                key={ch.chapter_id}
                href={`/student/subject/${ch.subject_slug}`}
                className="rounded-xl border border-orange-500/20 bg-orange-950/10 p-4 hover:border-orange-500/40"
              >
                <p className="font-medium text-white">{ch.chapter_name}</p>
                <p className="text-xs text-zinc-500">{ch.subject_name}</p>
                <div className="mt-3 flex gap-4 text-xs text-zinc-400">
                  <span>{ch.accuracy_percent}% accuracy</span>
                  <span>{ch.mistake_count} mistakes</span>
                  <span>{ch.doubt_count} doubts</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Daily practice</h2>
        <ContributionCalendar data={overview.calendar} />
      </section>
    </div>
  );
}
