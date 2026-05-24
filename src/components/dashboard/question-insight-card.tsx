"use client";

import Link from "next/link";
import { BarChart3, AlertCircle, Eye, HelpCircle } from "lucide-react";
import type { DifficultyLevel, QuestionType } from "@/types/questions";
import { getQuestionDifficultyColor, getAccuracyColor } from "@/lib/mock-data";

function normalizeDifficulty(difficulty: DifficultyLevel | null) {
  if (!difficulty) return null;
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

interface QuestionInsightCardProps {
  question: {
    id: string;
    title: string;
    chapter: string;
    difficulty: DifficultyLevel | null;
    type: QuestionType;
    accuracy: number;
    wrongCount: number;
    solutionViews: number;
    doubtCount: number;
    attemptCount: number;
  };
  variant: "wrong" | "viewed" | "doubt" | "lowest";
}

export function QuestionInsightCard({
  question,
  variant,
}: QuestionInsightCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 backdrop-blur-sm transition-all hover:border-violet-500/40 hover:bg-zinc-900/60">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate text-sm">
            {question.title}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">{question.chapter}</p>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-md whitespace-nowrap ${
            question.difficulty
              ? getQuestionDifficultyColor(normalizeDifficulty(question.difficulty) as "Easy" | "Medium" | "Hard")
              : "bg-zinc-800 text-zinc-300"
          }`}
        >
          {question.difficulty ? normalizeDifficulty(question.difficulty) : "Unknown"}
        </span>
      </div>

      {/* Main Metrics Row */}
      <div className="space-y-2 mb-4 pb-4 border-b border-zinc-800/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <BarChart3 className="h-3.5 w-3.5" />
            Accuracy
          </div>
          <span
            className={`font-bold text-sm ${getAccuracyColor(question.accuracy)}`}
          >
            {question.accuracy}%
          </span>
        </div>

        {/* Variant-specific metrics */}
        {variant === "wrong" && question.wrongCount && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
              Wrong Answers
            </div>
            <span className="font-bold text-sm text-red-400">
              {question.wrongCount}
            </span>
          </div>
        )}

        {variant === "viewed" && question.solutionViews && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <Eye className="h-3.5 w-3.5" />
              Solution Views
            </div>
            <span className="font-bold text-sm text-amber-400">
              {question.solutionViews}
            </span>
          </div>
        )}

        {variant === "doubt" && question.doubtCount && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs text-cyan-400">
              <HelpCircle className="h-3.5 w-3.5" />
              Doubts Raised
            </div>
            <span className="font-bold text-sm text-cyan-400">
              {question.doubtCount}
            </span>
          </div>
        )}

        {variant === "lowest" && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-400">Attempts</span>
            <span className="font-bold text-sm text-zinc-300">
              {question.attemptCount}
            </span>
          </div>
        )}
      </div>

      {/* Type Badge & Action */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-zinc-800/40 text-zinc-300">
          {question.type}
        </span>
        <Link
          href={`/teacher/questions/${question.id}`}
          className="text-xs px-2 py-1 rounded-md bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 transition-colors"
        >
          View Question
        </Link>
      </div>
    </div>
  );
}
