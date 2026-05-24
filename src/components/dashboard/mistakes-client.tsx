"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { QuestionQueueList } from "@/components/dashboard/question-queue-list";
import { QuestionQueueListSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { cn } from "@/lib/utils";
import type { MistakeFilter, QuestionListItem } from "@/types/dashboard";

const FILTERS: { id: MistakeFilter; label: string }[] = [
  { id: "recent", label: "Recently wrong" },
  { id: "repeated", label: "Most repeated" },
  { id: "chapter", label: "By chapter" },
];

export function MistakesClient() {
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [filter, setFilter] = useState<MistakeFilter>("recent");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/student/mistakes?filter=${filter}`, {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) setQuestions(data.questions ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/student/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-cyan-300"
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-red-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Mistake Section</h1>
            <p className="text-sm text-zinc-500">
              Wrong answers you haven&apos;t reattempted yet
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all",
              filter === f.id
                ? "bg-red-500/20 text-red-200 ring-1 ring-red-500/40"
                : "bg-zinc-900 text-zinc-400 hover:text-white",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <QuestionQueueListSkeleton />
      ) : (
        <QuestionQueueList
          questions={questions}
          emptyMessage="No pending mistakes — great work!"
          actionLabel="Reattempt"
        />
      )}
    </div>
  );
}
