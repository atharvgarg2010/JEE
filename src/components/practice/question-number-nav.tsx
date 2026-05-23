"use client";

import { cn } from "@/lib/utils";
import type { QuestionStatus, StudentQuestionWithAttempt } from "@/types/questions";

interface QuestionNumberNavProps {
  questions: StudentQuestionWithAttempt[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

function statusColor(status: QuestionStatus) {
  switch (status) {
    case "MASTERED":
      return "border-emerald-500/50 bg-emerald-500/20 text-emerald-300";
    case "CORRECT":
      return "border-cyan-500/50 bg-cyan-500/20 text-cyan-300";
    case "WRONG":
      return "border-red-500/50 bg-red-500/20 text-red-300";
    case "DOUBT":
      return "border-amber-500/50 bg-amber-500/20 text-amber-300";
    case "REVISION":
      return "border-fuchsia-500/50 bg-fuchsia-500/20 text-fuchsia-300";
    case "REATTEMPT":
      return "border-orange-500/50 bg-orange-500/20 text-orange-300";
    case "NOT_STARTED":
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-400";
  }
}

export function QuestionNumberNav({
  questions,
  currentIndex,
  onSelect,
}: QuestionNumberNavProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((q, i) => (
        <button
          key={q.id}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-all",
            statusColor(q.status),
            currentIndex === i &&
              "ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-950 scale-110",
          )}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
