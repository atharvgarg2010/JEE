"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Layers, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import type { BatchWithStats } from "@/lib/db/batches";

export default function TeacherBatchesPage() {
  const [batches, setBatches] = useState<BatchWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teacher/batches")
      .then((r) => r.json())
      .then((d) => setBatches(d.batches ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">My Batches</h1>
        <p className="mt-1 text-zinc-400">
          {loading ? "Loading…" : `${batches.length} batch${batches.length !== 1 ? "es" : ""} assigned to you`}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-zinc-800/50" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-zinc-800/80 bg-zinc-900/30 py-16 text-center">
          <Layers className="mb-4 h-12 w-12 text-zinc-700" />
          <p className="text-zinc-400">You haven&apos;t been assigned to any batches yet.</p>
          <p className="mt-2 text-sm text-zinc-600">Contact your admin to get assigned.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 transition-colors hover:border-violet-500/30"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{b.name}</h3>
                  <p className="mt-0.5 font-mono text-xs text-zinc-500">{b.code}</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="rounded-xl bg-zinc-800/60 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                    <Users className="h-3.5 w-3.5" /> Students
                  </div>
                  <p className="text-xl font-bold text-white">{b.student_count}</p>
                </div>
                <div className="rounded-xl bg-zinc-800/60 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Open Doubts
                  </div>
                  <p className={`text-xl font-bold ${b.doubts_pending > 0 ? "text-red-400" : "text-zinc-600"}`}>
                    {b.doubts_pending}
                  </p>
                </div>
              </div>

              {b.avg_accuracy !== null && (
                <div className="mt-3 rounded-xl bg-zinc-800/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Avg Accuracy</span>
                    <span className={`text-sm font-bold ${
                      b.avg_accuracy >= 70 ? "text-emerald-400" :
                      b.avg_accuracy >= 50 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {b.avg_accuracy}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-zinc-700">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        b.avg_accuracy >= 70 ? "bg-emerald-500" :
                        b.avg_accuracy >= 50 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${b.avg_accuracy}%` }}
                    />
                  </div>
                </div>
              )}

              <Link
                href={`/teacher/students?batch=${b.id}`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/40 py-2 text-sm text-zinc-400 transition-colors hover:border-violet-500/40 hover:text-violet-300"
              >
                <Users className="h-4 w-4" />
                View Students
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
