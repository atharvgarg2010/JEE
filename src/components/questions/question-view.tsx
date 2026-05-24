"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionMarkdown } from "@/components/questions/question-markdown";
import type { QuestionWithRelations } from "@/types/questions";

interface QuestionViewProps {
  question: QuestionWithRelations;
}

export function QuestionView({ question }: QuestionViewProps) {
  const [showSolution, setShowSolution] = useState(false);

  const answerLabel =
    question.question_type === "mcq"
      ? "Correct option"
      : "Correct integer answer";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
          Question
        </h2>
        <QuestionMarkdown content={question.question_text} className="prose prose-invert" />
      </section>

      {question.question_type === "mcq" && question.options && (
        <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Options
          </h2>
          <div className="space-y-3">
            {question.options.map((opt, index) => {
              const isCorrect = opt.id === question.correct_answer;
              const letter = String.fromCharCode(65 + index);
              return (
                <div
                  key={opt.id}
                  className={`rounded-2xl border px-4 py-3 transition-colors ${
                    isCorrect
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      : "border-zinc-800/70 bg-zinc-950/80 text-zinc-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="min-w-[1.5rem] text-sm font-semibold text-zinc-400">
                      {letter}.
                    </span>
                    <QuestionMarkdown content={opt.text} className="prose prose-invert m-0" />
                  </div>
                  {isCorrect && (
                    <span className="mt-3 inline-flex rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">
                      Correct answer
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {question.question_type === "integer" && (
        <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-zinc-500">
            {answerLabel}
          </h2>
          <p className="text-lg font-semibold text-emerald-300">
            {question.correct_answer}
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              Solution
            </h2>
            <p className="text-xs text-zinc-500">
              Expand to view the full solution details.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowSolution((current) => !current)}
          >
            {showSolution ? (
              <>
                Hide <ChevronUp className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Show <ChevronDown className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {showSolution && (
          <div className="mt-5 rounded-2xl border border-zinc-800/50 bg-zinc-950/80 p-4">
            <QuestionMarkdown content={question.solution} className="prose prose-invert" />
          </div>
        )}
      </section>

      {question.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
