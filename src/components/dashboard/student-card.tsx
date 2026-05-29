"use client";

import Link from "next/link";
import { User, TrendingUp, Zap, Clock, Target } from "lucide-react";
import type { TeacherStudentProfile } from "@/types/teacher-analytics";
import { getTeacherStudentStatusBadge } from "@/lib/teacher-analytics-utils";

interface StudentCardProps {
  student: TeacherStudentProfile;
  variant: "top" | "weak" | "improving" | "inactive";
}

export function StudentCard({ student, variant }: StudentCardProps) {
  const badge = getTeacherStudentStatusBadge(student);

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 backdrop-blur-sm transition-all hover:border-violet-500/40 hover:bg-zinc-900/60 hover:scale-105">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <Link 
              href={`/teacher/students/${student.id}`}
              className="font-semibold text-white truncate hover:text-indigo-400 transition-colors inline-block"
            >
              {student.name}
            </Link>
            <p className="text-xs text-zinc-500">
              {student.questionsAttempted} questions attempted
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {(variant === "top" || variant === "weak") && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Accuracy</span>
            <span
              className={`text-sm font-bold ${
                variant === "top" ? "text-green-400" : "text-red-400"
              }`}
            >
              {student.accuracy}%
            </span>
          </div>
        )}

        {(variant === "top" || variant === "weak") && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <Target className="h-3 w-3" />
              Mastery
            </span>
            <span className="text-sm font-bold text-cyan-400">
              {student.masteryPercent}%
            </span>
          </div>
        )}

        {variant === "improving" && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Current accuracy</span>
              <span className="text-sm font-bold text-green-400">
                {student.accuracy}%
              </span>
            </div>
            {student.improvement !== null && student.improvement > 0 && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-amber-400" />
                <span className="text-xs text-amber-300">
                  +{student.improvement}% vs prior week
                </span>
              </div>
            )}
          </>
        )}

        {variant === "inactive" &&
          student.daysInactive !== null &&
          student.daysInactive > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-zinc-500" />
              <span className="text-xs text-zinc-400">
                Inactive {student.daysInactive} day
                {student.daysInactive !== 1 ? "s" : ""}
              </span>
            </div>
          )}

        {variant === "top" && student.currentStreak > 0 && (
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-yellow-400" />
            <span className="text-xs text-yellow-300">
              {student.currentStreak} day streak
            </span>
          </div>
        )}

        {variant === "weak" && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Pending doubts</span>
              <span className="text-xs text-orange-400 font-semibold">
                {student.doubtsCount}
              </span>
            </div>
            {student.mistakesPending > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Mistakes pending</span>
                <span className="text-xs text-red-400 font-semibold">
                  {student.mistakesPending}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/40">
        <span className="text-xs font-medium text-zinc-400">{badge}</span>
        <Link
          href={`/teacher/students/${student.id}`}
          className="text-xs px-2 py-1 rounded-md bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 transition-colors"
        >
          View
        </Link>
      </div>
    </div>
  );
}
