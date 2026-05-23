"use client";

import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CategoryProgress } from "@/types/questions";

interface CategoryProgressCardProps {
  progress: CategoryProgress;
  subjectId: string;
  chapterId: string;
  index?: number;
}

export function CategoryProgressCard({
  progress,
  subjectId,
  chapterId,
  index = 0,
}: CategoryProgressCardProps) {
  const href = `/student/practice?subjectId=${subjectId}&chapterId=${chapterId}&categoryId=${progress.category_id}`;

  return (
    <article
      className="rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 p-5 transition-all hover:border-violet-500/30"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{progress.category_name}</h3>
          <p className="mt-1 text-xs text-zinc-500">
            {progress.remaining} remaining of {progress.total}
          </p>
        </div>
        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-violet-500/15">
          <Target className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-bold text-violet-300">
            {progress.mastery_percent}%
          </span>
        </div>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-700"
          style={{ width: `${progress.mastery_percent}%` }}
        />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Total", value: progress.total },
          { label: "Attempted", value: progress.attempted },
          { label: "Mastered", value: progress.mastered },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-zinc-950/50 py-2">
            <p className="text-lg font-semibold text-white">{value}</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              {label}
            </p>
          </div>
        ))}
      </div>

      <Button className="w-full" asChild disabled={progress.total === 0}>
        <Link href={progress.total > 0 ? href : "#"}>
          Start practice
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </article>
  );
}
