"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, HelpCircle } from "lucide-react";
import { QuestionQueueList } from "@/components/dashboard/question-queue-list";
import { QuestionQueueListSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { cn } from "@/lib/utils";
import type { QuestionListItem } from "@/types/dashboard";

type Tab = "unresolved" | "resolved" | "all";

export function DoubtsClient() {
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [tab, setTab] = useState<Tab>("unresolved");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const resolved =
      tab === "resolved" ? "true" : tab === "unresolved" ? "false" : "";
    const url = resolved
      ? `/api/student/doubts?resolved=${resolved}`
      : "/api/student/doubts";
    const res = await fetch(url, { cache: "no-store", credentials: "include" });
    const data = await res.json();
    if (data.success) setQuestions(data.questions ?? []);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function markResolved(questionId: string) {
    await fetch("/api/student/doubts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, doubtResolved: true }),
    });
    load();
  }

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
          <HelpCircle className="h-8 w-8 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Doubts</h1>
            <p className="text-sm text-zinc-500">Questions you marked for help</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "unresolved" as Tab, label: "Unresolved" },
            { id: "resolved" as Tab, label: "Resolved" },
            { id: "all" as Tab, label: "All" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all",
              tab === t.id
                ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40"
                : "bg-zinc-900 text-zinc-400 hover:text-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <QuestionQueueListSkeleton />
      ) : (
        <QuestionQueueList
          questions={questions}
          emptyMessage="No doubts in this view."
          actionLabel="Solve again"
          onResolve={tab === "unresolved" ? markResolved : undefined}
          resolveLabel="Mark solved"
        />
      )}
    </div>
  );
}
