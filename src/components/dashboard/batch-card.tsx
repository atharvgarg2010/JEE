"use client";

import { Users, TrendingUp, BookOpen, AlertCircle } from "lucide-react";
import type { MockBatch } from "@/lib/mock-data";

interface BatchCardProps {
  batch: MockBatch;
}

export function BatchCard({ batch }: BatchCardProps) {
  const accuracyColor =
    batch.avgAccuracy >= 75
      ? "text-green-400"
      : batch.avgAccuracy >= 60
        ? "text-yellow-400"
        : "text-red-400";

  const doubtsColor =
    batch.doubtsPending === 0
      ? "text-green-400"
      : batch.doubtsPending <= 5
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 backdrop-blur-sm transition-all hover:border-violet-500/40 hover:bg-zinc-900/60 hover:scale-105">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-semibold text-white text-sm">{batch.name}</h3>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${
              batch.status === "Active"
                ? "bg-green-500/15 text-green-300"
                : "bg-zinc-600/30 text-zinc-400"
            }`}
          >
            {batch.status}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-zinc-800/40">
        {/* Students */}
        <div className="rounded-lg bg-zinc-800/20 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-violet-400" />
            <span className="text-xs text-zinc-400">Students</span>
          </div>
          <p className="text-lg font-bold text-white">{batch.totalStudents}</p>
        </div>

        {/* Avg Accuracy */}
        <div className="rounded-lg bg-zinc-800/20 p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-zinc-400">Avg Accuracy</span>
          </div>
          <p className={`text-lg font-bold ${accuracyColor}`}>
            {batch.avgAccuracy}%
          </p>
        </div>

        {/* Practice Count */}
        <div className="rounded-lg bg-zinc-800/20 p-3">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-zinc-400">Practice Count</span>
          </div>
          <p className="text-lg font-bold text-white">
            {batch.totalPracticeCount}
          </p>
        </div>

        {/* Doubts Pending */}
        <div className="rounded-lg bg-zinc-800/20 p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-orange-400" />
            <span className="text-xs text-zinc-400">Doubts Pending</span>
          </div>
          <p className={`text-lg font-bold ${doubtsColor}`}>
            {batch.doubtsPending}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <button className="w-full text-sm font-semibold px-3 py-2 rounded-lg bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 transition-colors">
        View Batch
      </button>
    </div>
  );
}
