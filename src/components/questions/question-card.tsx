"use client";

import Link from "next/link";
import { BookOpen, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { stripMathForPreview } from "@/components/questions/question-markdown";
import type { QuestionWithRelations } from "@/types/questions";

interface QuestionCardProps {
  question: QuestionWithRelations;
  onDelete: (id: string) => void;
  deleting?: boolean;
}

export function QuestionCard({
  question,
  onDelete,
  deleting,
}: QuestionCardProps) {
  const rawPreview = stripMathForPreview(question.question_text);
  const preview =
    rawPreview.length > 120 ? `${rawPreview.slice(0, 120)}...` : rawPreview;

  return (
    <article className="group rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 p-5 transition-all hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-900/10">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge>{question.category_name}</Badge>
        <Badge variant="secondary">{question.subject_name}</Badge>
        <Badge variant="secondary">{question.chapter_name}</Badge>
        <Badge variant={question.question_type === "mcq" ? "default" : "warning"}>
          {question.question_type.toUpperCase()}
        </Badge>
        {question.difficulty && (
          <Badge
            variant={
              question.difficulty === "easy"
                ? "success"
                : question.difficulty === "hard"
                  ? "danger"
                  : "warning"
            }
          >
            {question.difficulty}
          </Badge>
        )}
      </div>

      <p className="text-sm leading-relaxed text-zinc-300">{preview}</p>

      {question.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-zinc-800/60 pt-4">
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <BookOpen className="h-3.5 w-3.5" />
          {new Date(question.created_at).toLocaleDateString()}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/teacher/questions/${question.id}`}>View</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(question.id)}
            disabled={deleting}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
