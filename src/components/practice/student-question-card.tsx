"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  HelpCircle,
  XCircle,
  RotateCcw,
  Bookmark,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { stripMathForPreview } from "@/components/questions/question-markdown";
import type { QuestionStatus, StudentQuestionWithAttempt } from "@/types/questions";

interface StudentQuestionCardProps {
  question: StudentQuestionWithAttempt;
  index: number;
  subjectId: string;
  chapterId: string;
}

function statusIcon(status: QuestionStatus) {
  switch (status) {
    case "MASTERED":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case "CORRECT":
      return <CheckCircle2 className="h-4 w-4 text-cyan-400" />;
    case "WRONG":
      return <XCircle className="h-4 w-4 text-red-400" />;
    case "DOUBT":
      return <HelpCircle className="h-4 w-4 text-amber-400" />;
    case "REVISION":
      return <Bookmark className="h-4 w-4 text-fuchsia-400" />;
    case "REATTEMPT":
      return <RotateCcw className="h-4 w-4 text-orange-400" />;
    default:
      return <Circle className="h-4 w-4 text-zinc-500" />;
  }
}

export function StudentQuestionCard({
  question,
  index,
  subjectId,
  chapterId,
}: StudentQuestionCardProps) {
  const rawPreview = stripMathForPreview(question.question_text);
  const preview =
    rawPreview.length > 100 ? `${rawPreview.slice(0, 100)}...` : rawPreview;

  const params = new URLSearchParams({
    subjectId,
    chapterId,
    categoryId: question.category_id,
    q: String(index),
  });
  if (question.difficulty) params.set("difficulty", question.difficulty);

  const href = `/student/practice?${params.toString()}`;

  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4 transition-all",
        "hover:border-cyan-500/40 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-cyan-900/10",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 font-semibold text-zinc-300">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {statusIcon(question.status)}
            <Badge variant="secondary">{question.category_name}</Badge>
            <Badge variant={question.question_type === "mcq" ? "default" : "warning"}>
              {question.question_type.toUpperCase()}
            </Badge>
            {question.difficulty && (
              <Badge variant="secondary">{question.difficulty}</Badge>
            )}
          </div>
          <p className="text-sm leading-relaxed text-zinc-300">{preview}</p>
          {question.progress && question.progress.total_attempts > 0 && (
            <p className="mt-2 text-xs text-zinc-500">
              {question.progress.total_attempts} attempt
              {question.progress.total_attempts !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-zinc-600 transition-transform group-hover:translate-x-1 group-hover:text-cyan-400" />
      </div>
    </Link>
  );
}
