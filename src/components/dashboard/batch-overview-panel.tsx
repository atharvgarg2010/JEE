"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Users, AlertCircle } from "lucide-react";
import { BatchOverviewPanelSkeleton } from "@/components/skeletons/dashboard-skeletons";
import type { BatchWithStats } from "@/lib/db/batches";

export function BatchOverviewPanel() {
  const [batches, setBatches] = useState<BatchWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teacher/batches")
      .then((r) => r.json())
      .then((d) => setBatches(d.batches ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <BatchOverviewPanelSkeleton />;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Batch Overview</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Your assigned batches
          </p>
        </div>
        <Link
          href="/teacher/batches"
          className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
        >
          View all →
        </Link>
      </div>

      {batches.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 px-6 py-10 text-center">
          <p className="text-sm text-zinc-500">No batches assigned yet. Ask admin to assign you.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batches.slice(0, 3).map((batch) => (
              <div
                key={batch.id}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 transition-colors hover:border-violet-500/20"
              >
                <p className="font-semibold text-white truncate">{batch.name}</p>
                <p className="text-xs font-mono text-zinc-500 mt-0.5">{batch.code}</p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Users className="h-3.5 w-3.5 text-zinc-600" />
                    <span>{batch.student_count} students</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className={`h-3.5 w-3.5 ${batch.doubts_pending > 0 ? "text-red-500" : "text-zinc-600"}`} />
                    <span className={batch.doubts_pending > 0 ? "text-red-400" : "text-zinc-600"}>
                      {batch.doubts_pending} doubts
                    </span>
                  </div>
                </div>

                {batch.avg_accuracy !== null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-500">Avg accuracy</span>
                      <span className={
                        batch.avg_accuracy >= 70 ? "text-emerald-400" :
                        batch.avg_accuracy >= 50 ? "text-amber-400" : "text-red-400"
                      }>
                        {batch.avg_accuracy}%
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-zinc-800">
                      <div
                        className={`h-1 rounded-full ${
                          batch.avg_accuracy >= 70 ? "bg-emerald-500" :
                          batch.avg_accuracy >= 50 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${batch.avg_accuracy}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {batches.length > 3 && (
            <div className="text-center">
              <Link
                href="/teacher/batches"
                className="text-sm text-zinc-500 hover:text-zinc-400 font-medium"
              >
                View all batches ({batches.length}) →
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}
