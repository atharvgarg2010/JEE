"use client";

import { History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionAttempt } from "@/types/questions";

interface AttemptHistoryPanelProps {
  history: QuestionAttempt[];
}

function formatTime(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AttemptHistoryPanel({ history }: AttemptHistoryPanelProps) {
  if (history.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950/50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-violet-400" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Attempt history
        </h3>
      </div>
      <ol className="space-y-2">
        {history.map((a) => (
          <li
            key={a.id}
            className={cn(
              "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm",
              a.is_correct
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-red-500/20 bg-red-950/20",
            )}
          >
            <span className="font-medium text-zinc-300">
              Attempt {a.attempt_number} →{" "}
              <span className={a.is_correct ? "text-emerald-400" : "text-red-400"}>
                {a.is_correct ? "Correct" : "Wrong"}
              </span>
            </span>
            <span className="text-xs text-zinc-500">
              {formatTime(a.time_taken_seconds)} · {formatDate(a.attempted_at)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
