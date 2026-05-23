"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  ChevronLeft,
  BookOpen,
  Flag,
  RefreshCw,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormFieldGroup } from "@/components/questions/form-field-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PracticeFilters } from "@/components/practice/practice-filters";
import { PracticeTimer } from "@/components/practice/practice-timer";
import { QuestionNumberNav } from "@/components/practice/question-number-nav";
import { AttemptResultPanel } from "@/components/practice/attempt-result-panel";
import { AttemptHistoryPanel } from "@/components/practice/attempt-history-panel";
import { NotifyTeacherButton } from "@/components/practice/notify-teacher-button";
import { cn } from "@/lib/utils";
import type {
  McqOption,
  PracticeFilter,
  QuestionAttempt,
  QuestionStatus,
  StudentQuestionProgress,
  StudentQuestionWithAttempt,
} from "@/types/questions";

const STATUS_LABELS: Record<QuestionStatus, string> = {
  NOT_STARTED: "Not started",
  CORRECT: "Correct",
  WRONG: "Wrong",
  DOUBT: "Doubt",
  REVISION: "Revision",
  MASTERED: "Mastered",
  REATTEMPT: "Reattempt",
};

export function PracticeSessionClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const subjectId = searchParams.get("subjectId") ?? "";
  const chapterId = searchParams.get("chapterId") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const difficulty = searchParams.get("difficulty") ?? "";
  const filter = (searchParams.get("filter") ?? "all") as PracticeFilter;
  const questionIdParam = searchParams.get("questionId");
  const qIndex = Math.max(0, Number(searchParams.get("q") ?? 0));

  const [questions, setQuestions] = useState<StudentQuestionWithAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [latestAttempt, setLatestAttempt] = useState<QuestionAttempt | null>(null);
  const [progress, setProgress] = useState<StudentQuestionProgress | null>(null);
  const [history, setHistory] = useState<QuestionAttempt[]>([]);
  const [solution, setSolution] = useState<string | null>(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timerRunning, setTimerRunning] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [meta, setMeta] = useState({ subject: "", chapter: "", category: "" });
  const [reattempting, setReattempting] = useState(false);
  const [localDoubt, setLocalDoubt] = useState(false);
  const solutionHiddenRef = useRef(false);

  const current = questions[qIndex] ?? null;
  const attemptsCount = progress?.total_attempts ?? latestAttempt?.attempt_number ?? 0;
  const solutionViewCount = progress?.solution_view_count ?? 0;

  const loadQuestions = useCallback(async () => {
    if (!subjectId || !chapterId) return;
    setLoading(true);
    const params = new URLSearchParams({
      subjectId,
      chapterId,
      filter,
    });
    if (categoryId) params.set("categoryId", categoryId);
    if (difficulty) params.set("difficulty", difficulty);

    const res = await fetch(`/api/student/practice/questions?${params}`, {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) {
      setQuestions(data.questions);
      if (data.questions[0]) {
        setMeta({
          subject: data.questions[0].subject_name,
          chapter: data.questions[0].chapter_name,
          category: data.questions[0].category_name,
        });
      }
    }
    setLoading(false);
  }, [subjectId, chapterId, categoryId, difficulty, filter]);

  const loadAttemptData = useCallback(async (questionId: string) => {
    const res = await fetch(`/api/student/practice/attempts/${questionId}`, {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) {
      setHistory(data.history ?? []);
      setProgress(data.progress ?? null);
      if (
        !solutionHiddenRef.current &&
        data.progress?.solution_view_count > 0
      ) {
        const solRes = await fetch(
          `/api/student/practice/questions/${questionId}`,
        );
        const solData = await solRes.json();
        if (solData.success && solData.solution) setSolution(solData.solution);
      }
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    if (loading || !questionIdParam || questions.length === 0) return;
    const idx = questions.findIndex((q) => q.id === questionIdParam);
    if (idx >= 0 && idx !== qIndex) {
      const p = new URLSearchParams(searchParams.toString());
      p.set("q", String(idx));
      router.replace(`/student/practice?${p.toString()}`);
    }
  }, [loading, questionIdParam, questions, qIndex, router, searchParams]);

  function applyQuestionState(q: StudentQuestionWithAttempt | null) {
    if (!q) return;
    const attempt = q.latest_attempt;
    const prog = q.progress;
    const hasAttempt = (prog?.total_attempts ?? 0) > 0;

    setSubmitted(hasAttempt);
    setIsCorrect(attempt?.is_correct ?? null);
    setLatestAttempt(attempt);
    setProgress(prog);
    setLocalDoubt(prog?.doubt_marked ?? attempt?.doubt_marked ?? false);
    setSelectedAnswer(hasAttempt && attempt ? attempt.selected_answer : "");
    setSolution(null);
    setTimerRunning(!hasAttempt);
    setElapsedSeconds(attempt?.time_taken_seconds ?? 0);
    setHistory([]);
    loadAttemptData(q.id);
  }

  useEffect(() => {
    setReattempting(false);
    solutionHiddenRef.current = false;
    applyQuestionState(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, qIndex]);

  function setQuery(patch: Record<string, string>) {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => p.set(k, v));
    router.push(`/student/practice?${p.toString()}`);
  }

  async function handleSubmit() {
    if (!current || !selectedAnswer.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/student/practice/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        questionId: current.id,
        selectedAnswer,
        timeTakenSeconds: elapsedSeconds,
        doubtMarked: localDoubt,
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (data.success) {
      setSubmitted(true);
      setReattempting(false);
      setIsCorrect(data.is_correct);
      setLatestAttempt(data.attempt);
      setProgress(data.progress);
      setHistory(data.history ?? []);
      setTimerRunning(false);
      await loadQuestions();
    }
  }

  async function patchProgress(body: Record<string, unknown>) {
    if (!current) return null;
    const res = await fetch(
      `/api/student/practice/attempts/${current.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      },
    );
    const data = await res.json();
    if (data.success) {
      setProgress(data.progress);
      setHistory(data.history ?? []);
      return data;
    }
    return null;
  }

  async function handleViewSolution() {
    if (!current) return;
    solutionHiddenRef.current = false;
    setLoadingSolution(true);
    const data = await patchProgress({ viewSolution: true });
    if (data?.solution) setSolution(data.solution);
    if (data?.progress) setProgress(data.progress);
    setLoadingSolution(false);
    await loadQuestions();
  }

  async function handleReattempt() {
    if (current) {
      await patchProgress({ prepareReattempt: true });
    }
    solutionHiddenRef.current = true;
    setReattempting(true);
    setSubmitted(false);
    setIsCorrect(null);
    setSelectedAnswer("");
    setSolution(null);
    setTimerRunning(true);
    setElapsedSeconds(0);
  }

  async function toggleDoubt() {
    const next = !(progress?.doubt_marked ?? localDoubt);
    setLocalDoubt(next);
    const data = await patchProgress({ doubtMarked: next });
    if (data?.progress) setProgress(data.progress);
    await loadQuestions();
  }

  async function toggleRevision() {
    const next = !(progress?.saved_for_revision ?? false);
    const data = await patchProgress({ savedForRevision: next });
    if (data?.progress) setProgress(data.progress);
    await loadQuestions();
  }

  const showResult = submitted && isCorrect !== null && !reattempting;
  const status = current?.status ?? progress?.status ?? "NOT_STARTED";

  if (!subjectId || !chapterId) {
    return (
      <div className="py-16 text-center">
        <p className="text-zinc-400">Invalid practice session.</p>
        <Button className="mt-4" asChild>
          <Link href="/student/explorer">Go to Explorer</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500 animate-pulse-soft">
        Loading practice session...
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-6 py-12 text-center">
        <p className="text-zinc-400">No questions in this section yet.</p>
        <Button asChild>
          <Link href="/student/explorer">Back to Explorer</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/student/explorer"
            className="mb-2 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-cyan-300 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Explorer
          </Link>
          <h1 className="text-2xl font-bold text-white">{meta.category}</h1>
          <p className="text-sm text-zinc-500">
            {meta.subject} · {meta.chapter}
            {difficulty && ` · ${difficulty}`}
          </p>
        </div>
        <PracticeTimer
          running={timerRunning && !showResult}
          resetKey={`${current?.id}-${reattempting}`}
          onTick={setElapsedSeconds}
        />
      </div>

      <PracticeFilters
        value={filter}
        onChange={(f) => setQuery({ filter: f, q: "0" })}
      />

      <QuestionNumberNav
        questions={questions}
        currentIndex={qIndex}
        onSelect={(i) => setQuery({ q: String(i) })}
      />

      {current && (
        <div className="animate-fade-in-up grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <article className="rounded-2xl border border-zinc-800/60 bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 p-6 sm:p-8 shadow-xl shadow-black/20">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge>{current.question_type.toUpperCase()}</Badge>
                {current.difficulty && (
                  <Badge variant="secondary">{current.difficulty}</Badge>
                )}
                <Badge
                  variant={
                    status === "MASTERED" || status === "CORRECT"
                      ? "default"
                      : status === "WRONG"
                        ? "warning"
                        : "secondary"
                  }
                >
                  {STATUS_LABELS[status]}
                </Badge>
                {(progress?.doubt_marked || localDoubt) && (
                  <Badge variant="warning">Doubt</Badge>
                )}
                {progress?.saved_for_revision && (
                  <Badge variant="secondary">Revision</Badge>
                )}
              </div>

              <p className="whitespace-pre-wrap text-lg leading-relaxed text-zinc-100">
                {current.question_text}
              </p>

              <div className="mt-8 space-y-3">
                {current.question_type === "mcq" && current.options ? (
                  current.options.map((opt: McqOption, i) => {
                    const selected = selectedAnswer === opt.id;
                    const showCorrect =
                      showResult &&
                      isCorrect === false &&
                      latestAttempt?.selected_answer === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-200",
                          selected
                            ? "border-violet-500/60 bg-violet-500/15 shadow-md shadow-violet-900/20"
                            : "border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-600",
                          showResult && "pointer-events-none",
                          showCorrect && "border-red-500/40 bg-red-950/30",
                        )}
                      >
                        <input
                          type="radio"
                          name="answer"
                          checked={selected}
                          onChange={() => setSelectedAnswer(opt.id)}
                          disabled={showResult}
                          className="accent-violet-500 h-4 w-4"
                        />
                        <span className="font-semibold text-zinc-500 w-6">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        <span className="text-zinc-200">{opt.text}</span>
                      </label>
                    );
                  })
                ) : (
                  <FormFieldGroup label="Your answer (integer)">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={selectedAnswer}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      disabled={showResult}
                      placeholder="Enter numerical answer"
                      className="max-w-xs text-lg font-mono border-zinc-700 bg-zinc-950/80"
                    />
                  </FormFieldGroup>
                )}
              </div>
            </article>

            {showResult && (
              <AttemptResultPanel
                isCorrect={!!isCorrect}
                attemptsCount={attemptsCount}
                solutionViewCount={solutionViewCount}
                onReattempt={handleReattempt}
                onViewSolution={handleViewSolution}
                loadingSolution={loadingSolution}
                solutionVisible={!!solution && !reattempting}
              />
            )}

            {solution && !reattempting && (
              <Alert className="animate-fade-in border-violet-500/30 bg-violet-950/20">
                <BookOpen className="h-4 w-4 text-violet-400" />
                <AlertDescription>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-violet-400">
                    Solution
                    {solutionViewCount > 0 && (
                      <span className="ml-2 normal-case text-zinc-500">
                        · viewed {solutionViewCount} time
                        {solutionViewCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                  <p className="whitespace-pre-wrap text-zinc-300">{solution}</p>
                </AlertDescription>
              </Alert>
            )}

            <AttemptHistoryPanel history={history} />
          </div>

          <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4 space-y-2 shadow-lg">
              <p className="text-xs text-zinc-500">
                Question {qIndex + 1} of {questions.length}
              </p>
              {attemptsCount > 0 && (
                <p className="text-xs text-cyan-400/80">
                  {attemptsCount} total attempt{attemptsCount !== 1 ? "s" : ""}
                </p>
              )}

              {!showResult && (
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!selectedAnswer.trim() || submitting}
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              )}

              {(showResult || attemptsCount > 0) && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleReattempt}
                >
                  <RefreshCw className="h-4 w-4" />
                  Reattempt
                </Button>
              )}

              <Button
                variant="secondary"
                className="w-full"
                onClick={handleViewSolution}
                disabled={loadingSolution}
              >
                <BookOpen className="h-4 w-4" />
                {loadingSolution ? "Loading..." : "View solution"}
              </Button>

              <Button variant="secondary" className="w-full" onClick={toggleDoubt}>
                <Flag className="h-4 w-4" />
                {(progress?.doubt_marked || localDoubt) ? "Unmark doubt" : "Mark doubt"}
              </Button>

              <Button variant="secondary" className="w-full" onClick={toggleRevision}>
                <Bookmark className="h-4 w-4" />
                {progress?.saved_for_revision
                  ? "Remove revision"
                  : "Save for revision"}
              </Button>

              {current && <NotifyTeacherButton questionId={current.id} />}

              <Button
                className="w-full mt-2"
                disabled={qIndex >= questions.length - 1}
                onClick={() => setQuery({ q: String(qIndex + 1) })}
              >
                Next question
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="flex gap-2 pt-2 border-t border-zinc-800/60">
                <Button
                  variant="ghost"
                  className="flex-1"
                  disabled={qIndex === 0}
                  onClick={() => setQuery({ q: String(qIndex - 1) })}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1"
                  disabled={qIndex >= questions.length - 1}
                  onClick={() => setQuery({ q: String(qIndex + 1) })}
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
