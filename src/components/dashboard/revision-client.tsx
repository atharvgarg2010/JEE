"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, BookMarked } from "lucide-react";
import { QuestionQueueList } from "@/components/dashboard/question-queue-list";
import type { QuestionListItem } from "@/types/dashboard";

export function RevisionClient() {
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/revision", { cache: "no-store", credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setQuestions(data.questions ?? []);
        setLoading(false);
      });
  }, []);

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
          <BookMarked className="h-8 w-8 text-fuchsia-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Save for Revision</h1>
            <p className="text-sm text-zinc-500">Your personal revision queue</p>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading revision list...</p>
      ) : (
        <QuestionQueueList
          questions={questions}
          emptyMessage="No questions saved for revision yet."
          actionLabel="Revise now"
        />
      )}
    </div>
  );
}
