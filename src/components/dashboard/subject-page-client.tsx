"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, BookOpen } from "lucide-react";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { ChapterGridSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChapterSummary, SubjectSummary } from "@/types/dashboard";

interface SubjectPageClientProps {
  slug: string;
  subjectName: string;
}

export function SubjectPageClient({ slug, subjectName }: SubjectPageClientProps) {
  const [subject, setSubject] = useState<SubjectSummary | null>(null);
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/student/subjects/${slug}`, { cache: "no-store", credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSubject(data.subject);
          setChapters(data.chapters ?? []);
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <ChapterGridSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Link
          href="/student/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-cyan-300"
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white">{subjectName}</h1>
        {subject && (
          <p className="mt-2 text-zinc-400">
            {subject.attempted} of {subject.total_questions} attempted ·{" "}
            {subject.mastery_percent}% mastery
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chapters.map((ch) => (
          <Link
            key={ch.id}
            href={`/student/subject/${slug}/chapter/${ch.id}`}
            className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5 transition-all hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-900/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800">
                  <BookOpen className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-cyan-200">
                    {ch.name}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {ch.remaining} remaining · {ch.attempted} done
                  </p>
                </div>
              </div>
              <ProgressRing
                value={ch.mastery_percent}
                size={48}
                stroke={4}
                accent="stroke-violet-400"
              />
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all"
                style={{ width: `${ch.mastery_percent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Accuracy {ch.accuracy_percent}% · {ch.total_questions} questions
            </p>
          </Link>
        ))}
      </div>

      {chapters.length === 0 && (
        <p className="text-center text-zinc-500">No chapters yet for this subject.</p>
      )}
    </div>
  );
}
