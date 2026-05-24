"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, BookOpen, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ExplorerQuestionListSkeleton } from "@/components/skeletons/dashboard-skeletons";
import type {
  ExplorerChapterNode,
  ExplorerLeaf,
  ExplorerSubjectNode,
  StudentQuestionWithAttempt,
} from "@/types/questions";

interface ExplorerTreeProps {
  tree: ExplorerSubjectNode[];
  questions: StudentQuestionWithAttempt[];
  selectedBucket: {
    subjectId: string;
    chapterId: string;
    categoryId: string;
    difficulty?: string;
    label: string;
  } | null;
  onSelectBucket: (bucket: ExplorerTreeProps["selectedBucket"]) => void;
  loadingQuestions?: boolean;
}

function LeafButton({
  leaf,
  active,
  onClick,
}: {
  leaf: ExplorerLeaf;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={leaf.questionCount === 0}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-all",
        leaf.questionCount === 0
          ? "cursor-not-allowed text-zinc-600"
          : "text-zinc-300 hover:bg-zinc-800/80",
        active && "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30",
      )}
    >
      <span>{leaf.label}</span>
      <Badge variant={leaf.questionCount > 0 ? "default" : "secondary"}>
        {leaf.questionCount}
      </Badge>
    </button>
  );
}

function ChapterBlock({
  chapter,
  subjectId,
  selectedBucket,
  onSelectBucket,
  defaultOpen,
}: {
  chapter: ExplorerChapterNode;
  subjectId: string;
  selectedBucket: ExplorerTreeProps["selectedBucket"];
  onSelectBucket: ExplorerTreeProps["onSelectBucket"];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [moduleOpen, setModuleOpen] = useState(true);
  const [cbtOpen, setCbtOpen] = useState(true);

  const isActiveChapter = selectedBucket?.chapterId === chapter.id;

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden transition-all",
        isActiveChapter && "border-cyan-500/25",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-zinc-800/40 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-cyan-400 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
        )}
        <BookOpen className="h-4 w-4 text-violet-400 shrink-0" />
        <span className="flex-1 font-medium text-white">{chapter.name}</span>
        <Badge variant="secondary">{chapter.questionCount}</Badge>
      </button>

      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-zinc-800/60 px-3 py-3">
            <div>
              <button
                type="button"
                onClick={() => setModuleOpen(!moduleOpen)}
                className="mb-2 flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500"
              >
                {moduleOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Module
              </button>
              {moduleOpen && (
                <div className="space-y-1 pl-2 animate-fade-in">
                  {chapter.module.items.map((leaf) => (
                    <LeafButton
                      key={leaf.key}
                      leaf={leaf}
                      active={
                        selectedBucket?.chapterId === chapter.id &&
                        selectedBucket?.categoryId === leaf.categoryId &&
                        !selectedBucket?.difficulty
                      }
                      onClick={() =>
                        onSelectBucket({
                          subjectId,
                          chapterId: chapter.id,
                          categoryId: leaf.categoryId!,
                          label: `${chapter.name} · ${leaf.label}`,
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setCbtOpen(!cbtOpen)}
                className="mb-2 flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500"
              >
                {cbtOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Created by Teacher
              </button>
              {cbtOpen && (
                <div className="space-y-1 pl-2 animate-fade-in">
                  {chapter.createdByTeacher.map((leaf) => (
                    <LeafButton
                      key={leaf.key}
                      leaf={leaf}
                      active={
                        selectedBucket?.chapterId === chapter.id &&
                        selectedBucket?.categoryId === leaf.categoryId &&
                        selectedBucket?.difficulty === leaf.difficulty
                      }
                      onClick={() =>
                        onSelectBucket({
                          subjectId,
                          chapterId: chapter.id,
                          categoryId: leaf.categoryId!,
                          difficulty: leaf.difficulty,
                          label: `${chapter.name} · ${leaf.label}`,
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "text-zinc-400",
  CORRECT: "text-emerald-400",
  WRONG: "text-red-400",
  DOUBT: "text-amber-400",
  REVISION: "text-fuchsia-400",
  MASTERED: "text-cyan-400",
  REATTEMPT: "text-orange-400",
};

export function ExplorerTree({
  tree,
  questions,
  selectedBucket,
  onSelectBucket,
  loadingQuestions,
}: ExplorerTreeProps) {
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    tree.forEach((s) => {
      init[s.id] = true;
    });
    return init;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Layers className="h-5 w-5 text-violet-400" />
          Browse syllabus
        </h2>

        {tree.map((subject) => (
          <div
            key={subject.id}
            className="rounded-2xl border border-zinc-800/60 bg-zinc-950/50 overflow-hidden"
          >
            <button
              type="button"
              onClick={() =>
                setOpenSubjects((p) => ({ ...p, [subject.id]: !p[subject.id] }))
              }
              className="flex w-full items-center gap-3 px-4 py-4 hover:bg-zinc-900/60 transition-colors"
            >
              {openSubjects[subject.id] ? (
                <ChevronDown className="h-5 w-5 text-violet-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-zinc-500" />
              )}
              <span className="text-lg font-semibold text-white">{subject.name}</span>
              <Badge className="ml-auto">{subject.questionCount}</Badge>
            </button>

            <div
              className={cn(
                "grid transition-all duration-300",
                openSubjects[subject.id]
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="space-y-2 border-t border-zinc-800/60 p-3">
                  {subject.chapters.map((ch, i) => (
                    <ChapterBlock
                      key={ch.id}
                      chapter={ch}
                      subjectId={subject.id}
                      selectedBucket={selectedBucket}
                      onSelectBucket={onSelectBucket}
                      defaultOpen={i === 0 && ch.questionCount > 0}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <h2 className="mb-4 text-lg font-semibold text-white">
          {selectedBucket?.label ?? "Select a category"}
        </h2>

        {loadingQuestions ? (
          <ExplorerQuestionListSkeleton />
        ) : !selectedBucket ? (
          <p className="rounded-xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
            Expand a subject and chapter, then pick a module category or difficulty level.
          </p>
        ) : questions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
            No questions in this section yet.
          </p>
        ) : (
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {questions.map((q, i) => (
              <Link
                key={q.id}
                href={`/student/practice?questionId=${q.id}&subjectId=${q.subject_id}&chapterId=${q.chapter_id}&categoryId=${q.category_id}${q.difficulty ? `&difficulty=${q.difficulty}` : ""}`}
                className="block rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4 transition-all hover:border-cyan-500/40 hover:bg-zinc-900/80"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-zinc-500">Q{i + 1}</span>
                  <span
                    className={cn(
                      "text-xs font-semibold uppercase",
                      STATUS_COLORS[q.status] ?? "text-zinc-400",
                    )}
                  >
                    {q.status.replace("_", " ")}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-zinc-200">{q.question_text}</p>
                {q.progress && q.progress.total_attempts > 0 && (
                  <p className="mt-2 text-xs text-zinc-500">
                    {q.progress.total_attempts} attempt
                    {q.progress.total_attempts !== 1 ? "s" : ""}
                    {q.progress.solution_view_count > 0 &&
                      ` · Solution viewed ${q.progress.solution_view_count}×`}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
