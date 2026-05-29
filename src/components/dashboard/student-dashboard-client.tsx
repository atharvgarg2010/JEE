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
import { StudentDashboardSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { StudentAnnouncementsWidget } from "@/components/dashboard/student-announcements-widget";
import type { DashboardOverview } from "@/types/dashboard";

const SUBJECT_ICONS: Record<string, typeof Atom> = {
  physics: Atom,
  chemistry: Sparkles,
  mathematics: Calculator,
};

const SUBJECT_GRADIENTS: Record<string, string> = {
  physics: "border-zinc-800",
  chemistry: "border-zinc-800",
  mathematics: "border-zinc-800",
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
    return <StudentDashboardSkeleton />;
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
      <div className="rounded-md border border-zinc-800 bg-zinc-900 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Hello, {userName}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Track PCM progress, fix mistakes, clear doubts, and build your daily streak.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/student/explorer">
              <Compass className="h-4 w-4" />
              Explorer
            </Link>
          </Button>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Pending actions</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
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
              href: "/student/explorer",
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
              className="rounded-md border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:bg-zinc-800/50"
            >
              <Icon className={`mb-2 h-5 w-5 ${color}`} />
              <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-zinc-100">{value}</p>
            </Link>
          ))}
        </div>
      </section>

      {overview.weak_chapters.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">The Weakness Ledger</h2>
          <div className="overflow-x-auto w-full pb-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chapter</TableHead>
                  <TableHead className="hidden md:table-cell">Subject</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead className="hidden sm:table-cell">Mistakes</TableHead>
                  <TableHead className="hidden sm:table-cell">Pending Doubts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.weak_chapters.map((ch) => (
                  <TableRow key={ch.chapter_id} className="group cursor-pointer" onClick={() => window.location.href = `/student/subject/${ch.subject_slug}`}>
                    <TableCell className="font-medium text-zinc-100 whitespace-nowrap">{ch.chapter_name}</TableCell>
                    <TableCell className="hidden md:table-cell text-zinc-400">{ch.subject_name}</TableCell>
                    <TableCell className="text-red-400 font-mono">{ch.accuracy_percent}%</TableCell>
                    <TableCell className="hidden sm:table-cell text-zinc-400 font-mono">{ch.mistake_count}</TableCell>
                    <TableCell className="hidden sm:table-cell text-zinc-400 font-mono">{ch.doubt_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Announcements widget */}
      <StudentAnnouncementsWidget />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
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
            className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 p-4"
          >
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-zinc-100">{value}</p>
            </div>
            <Icon className="h-6 w-6 text-indigo-400 opacity-80" />
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">PCM subjects</h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {overview.subjects.map((sub) => {
            const Icon = SUBJECT_ICONS[sub.slug] ?? Atom;
            const gradient =
              SUBJECT_GRADIENTS[sub.slug] ??
              "from-zinc-800/40 to-zinc-950 border-zinc-700/50";
            return (
              <Link
                key={sub.id}
                href={`/student/subject/${sub.slug}`}
                className={`group rounded-md border bg-zinc-900 p-5 transition-colors hover:bg-zinc-800/50 ${gradient}`}
              >
                <div className="flex items-start justify-between">
                  <Icon className="h-6 w-6 text-indigo-400" />
                  <ProgressRing
                    value={sub.mastery_percent}
                    size={48}
                    stroke={4}
                    accent="stroke-indigo-400"
                  />
                </div>
                <h3 className="mt-4 text-lg font-bold text-zinc-100">{sub.name}</h3>
                <p className="mt-1 text-xs text-zinc-400">
                  {sub.chapters_count} chapters · {sub.attempted}/{sub.total_questions} attempted
                </p>
              </Link>
            );
          })}
        </div>
      </section>

    </div>
  );
}
