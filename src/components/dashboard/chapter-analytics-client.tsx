"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { buildBucketPracticeHref } from "@/lib/practice-links";
import { ChapterAnalyticsSkeleton } from "@/components/skeletons/dashboard-skeletons";
import type { CategoryBucketStats, ChapterAnalytics } from "@/types/dashboard";

function BucketCard({
  bucket,
  subjectId,
  chapterId,
}: {
  bucket: CategoryBucketStats;
  subjectId: string;
  chapterId: string;
}) {
  const href = buildBucketPracticeHref(
    subjectId,
    chapterId,
    bucket.category_id,
    bucket.difficulty,
  );

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-medium text-white">{bucket.label}</h4>
          <p className="text-xs text-zinc-500 mt-1">
            {bucket.attempted}/{bucket.total} attempted · {bucket.remaining} left
          </p>
        </div>
        <ProgressRing
          value={bucket.progress_percent}
          size={44}
          stroke={4}
          label="done"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-zinc-950/60 px-2 py-1.5">
          <span className="text-zinc-500">Accuracy</span>
          <p className="font-semibold text-cyan-300">{bucket.accuracy_percent}%</p>
        </div>
        <div className="rounded-lg bg-zinc-950/60 px-2 py-1.5">
          <span className="text-zinc-500">Correct</span>
          <p className="font-semibold text-emerald-300">{bucket.correct_count}</p>
        </div>
      </div>
      {bucket.total > 0 && (
        <Button className="mt-3 w-full" size="sm" variant="secondary" asChild>
          <Link href={href}>Practice</Link>
        </Button>
      )}
    </div>
  );
}

interface ChapterAnalyticsClientProps {
  subjectSlug: string;
  subjectName: string;
  chapterId: string;
}

export function ChapterAnalyticsClient({
  subjectSlug,
  subjectName,
  chapterId,
}: ChapterAnalyticsClientProps) {
  const [analytics, setAnalytics] = useState<ChapterAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/student/subjects/${subjectSlug}/chapters/${chapterId}`, {
      cache: "no-store",
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAnalytics(data.analytics);
        setLoading(false);
      });
  }, [subjectSlug, chapterId]);

  if (loading) {
    return <ChapterAnalyticsSkeleton />;
  }

  if (!analytics) {
    return <p className="text-zinc-500">Chapter not found.</p>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Link
          href={`/student/subject/${subjectSlug}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-cyan-300"
        >
          <ChevronLeft className="h-4 w-4" />
          {subjectName}
        </Link>
        <h1 className="text-2xl font-bold text-white">{analytics.chapter_name}</h1>
        <Badge variant="secondary" className="mt-2">
          Category analytics
        </Badge>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Module
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {analytics.module.map((b) => (
            <BucketCard
              key={b.key}
              bucket={b}
              subjectId={analytics.subject_id}
              chapterId={analytics.chapter_id}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Created by Teacher
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {analytics.created_by_teacher.map((b) => (
            <BucketCard
              key={b.key}
              bucket={b}
              subjectId={analytics.subject_id}
              chapterId={analytics.chapter_id}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
