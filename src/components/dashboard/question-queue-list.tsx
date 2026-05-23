"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildPracticeHref } from "@/lib/practice-links";
import type { QuestionListItem } from "@/types/dashboard";

interface QuestionQueueListProps {
  questions: QuestionListItem[];
  emptyMessage: string;
  actionLabel?: string;
  onResolve?: (questionId: string) => void;
  resolveLabel?: string;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function QuestionQueueList({
  questions,
  emptyMessage,
  actionLabel = "Solve again",
  onResolve,
  resolveLabel = "Mark resolved",
}: QuestionQueueListProps) {
  if (questions.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-700 p-12 text-center text-zinc-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <div
          key={q.id}
          className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{q.subject_name}</Badge>
                <Badge variant="secondary">{q.chapter_name}</Badge>
                <Badge>{q.category_name}</Badge>
                {q.difficulty && <Badge variant="warning">{q.difficulty}</Badge>}
              </div>
              <p className="line-clamp-2 text-sm text-zinc-200">{q.question_text}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {q.total_attempts} attempt{q.total_attempts !== 1 ? "s" : ""}
                {q.last_attempted_at && ` · Last: ${formatDate(q.last_attempted_at)}`}
                {q.doubt_marked_at && !q.doubt_resolved &&
                  ` · Doubt: ${formatDate(q.doubt_marked_at)}`}
                {q.revision_saved_at &&
                  ` · Saved: ${formatDate(q.revision_saved_at)}`}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {onResolve && !q.doubt_resolved && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onResolve(q.id)}
                >
                  {resolveLabel}
                </Button>
              )}
              <Button size="sm" asChild>
                <Link href={buildPracticeHref(q)}>
                  <RotateCcw className="h-4 w-4" />
                  {actionLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
