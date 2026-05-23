"use client";

import { CheckCircle2, RefreshCw, XCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AttemptResultPanelProps {
  isCorrect: boolean;
  attemptsCount: number;
  solutionViewCount?: number;
  onReattempt: () => void;
  onViewSolution: () => void;
  loadingSolution?: boolean;
  solutionVisible?: boolean;
}

export function AttemptResultPanel({
  isCorrect,
  attemptsCount,
  solutionViewCount = 0,
  onReattempt,
  onViewSolution,
  loadingSolution,
  solutionVisible,
}: AttemptResultPanelProps) {
  if (isCorrect) {
    return (
      <div className="animate-fade-in space-y-4">
        <Alert variant="success" className="border-emerald-500/30">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <AlertDescription className="text-emerald-200">
            Correct on attempt #{attemptsCount}! You can reattempt for more practice
            or view the solution.
          </AlertDescription>
        </Alert>
        <div className="flex flex-wrap gap-3">
          <Button onClick={onReattempt} variant="secondary">
            <RefreshCw className="h-4 w-4" />
            Reattempt question
          </Button>
          {!solutionVisible && (
            <Button onClick={onViewSolution} disabled={loadingSolution} variant="secondary">
              <BookOpen className="h-4 w-4" />
              {loadingSolution ? "Loading..." : "View solution"}
            </Button>
          )}
        </div>
        {solutionViewCount > 0 && (
          <p className="text-xs text-zinc-500">
            Solution viewed {solutionViewCount} time{solutionViewCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-4 rounded-2xl border border-red-500/20 bg-red-950/20 p-5">
      <div className="flex items-center gap-3">
        <XCircle className="h-6 w-6 text-red-400" />
        <div>
          <p className="font-semibold text-red-200">Incorrect answer</p>
          <p className="text-sm text-zinc-400">
            Attempt #{attemptsCount} — reattempt anytime, even after viewing the solution.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onReattempt} variant="secondary">
          <RefreshCw className="h-4 w-4" />
          Reattempt question
        </Button>
        {!solutionVisible && (
          <Button onClick={onViewSolution} disabled={loadingSolution}>
            <BookOpen className="h-4 w-4" />
            {loadingSolution ? "Loading..." : "View solution"}
          </Button>
        )}
      </div>
      {solutionViewCount > 0 && (
        <p className="text-xs text-zinc-500">
          Solution viewed {solutionViewCount} time{solutionViewCount !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
