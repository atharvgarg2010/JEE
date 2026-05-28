"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Loader2, AlertCircle } from "lucide-react";
import type { StudentModuleAnalyticsRow } from "@/types/modules";

// ── Compact horizontal progress bar ──────────────────────────────────────────

function CompletionBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const color =
    clamped >= 80
      ? "bg-emerald-500"
      : clamped >= 50
      ? "bg-indigo-500"
      : clamped >= 20
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-12 sm:w-16 rounded-full bg-zinc-800/80 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-8 text-right font-mono text-[10px] sm:text-xs tabular-nums text-zinc-400">
        {clamped.toFixed(0)}%
      </span>
    </div>
  );
}

// ── Offline Module Progress section ──────────────────────────────────────────

export interface OfflineModuleAnalyticsSectionProps {
  studentId: string;
  role?: "teacher" | "admin";
}

export function OfflineModuleAnalyticsSection({
  studentId,
  role = "teacher",
}: OfflineModuleAnalyticsSectionProps) {
  const [rows, setRows] = useState<StudentModuleAnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compact filters
  const [filterSubject, setFilterSubject] = useState("");
  const [filterLowOnly, setFilterLowOnly] = useState(false);
  const [filterDoubtsOnly, setFilterDoubtsOnly] = useState(false);

  const fetchAnalytics = useCallback(() => {
    setLoading(true);
    setError(null);
    const endpoint = role === "admin"
      ? `/api/admin/users/${studentId}/module-analytics`
      : `/api/teacher/students/${studentId}/module-analytics`;
    fetch(endpoint)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.error ?? "Failed");
        setRows(d.analytics ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [studentId, role]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Derived subject list for filter dropdown
  const subjects = [...new Set(rows.map((r) => r.subject))].sort();

  // Apply client-side filters (data already sorted server-side)
  const visible = rows.filter((r) => {
    if (filterSubject && r.subject !== filterSubject) return false;
    if (filterLowOnly && r.completion_pct >= 50) return false;
    if (filterDoubtsOnly && r.open_doubts === 0) return false;
    return true;
  });

  const thCls =
    "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap bg-zinc-950/80 backdrop-blur-sm";
  const thRCls =
    "px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-950/80 backdrop-blur-sm";

  return (
    <div className="mt-8 space-y-3">
      {/* Section header + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/60 pb-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Offline Module Progress
          </h2>
          {!loading && !error && (
            <p className="mt-0.5 text-xs text-zinc-600">
              {rows.length} module{rows.length !== 1 ? "s" : ""} attempted
            </p>
          )}
        </div>

        {/* Compact filter controls */}
        {rows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Subject filter */}
            <select
              id="ma-filter-subject"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none"
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Low completion toggle */}
            <button
              id="ma-filter-low"
              onClick={() => setFilterLowOnly((v) => !v)}
              className={`rounded border px-2 py-1 text-xs font-medium transition-colors ${
                filterLowOnly
                  ? "border-amber-600/50 bg-amber-600/10 text-amber-400"
                  : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              }`}
            >
              &lt;50% only
            </button>

            {/* Open doubts toggle */}
            <button
              id="ma-filter-doubts"
              onClick={() => setFilterDoubtsOnly((v) => !v)}
              className={`rounded border px-2 py-1 text-xs font-medium transition-colors ${
                filterDoubtsOnly
                  ? "border-red-600/50 bg-red-600/10 text-red-400"
                  : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              }`}
            >
              Open doubts
            </button>
          </div>
        )}
      </div>

      {/* States */}
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading module analytics…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded border border-red-900/40 bg-red-900/10 px-3 py-2 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center rounded border border-zinc-800/60 bg-zinc-900/20 py-10 text-center">
          <BookOpen className="mb-2 h-7 w-7 text-zinc-700" />
          <p className="text-sm font-medium text-zinc-400">No offline module activity yet.</p>
          <p className="mt-1 text-xs text-zinc-600">
            The student has not logged any coaching module questions.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded border border-zinc-800/60 bg-zinc-900/20 px-4 py-4 text-xs text-zinc-500 text-center">
          No modules match the active filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-zinc-800/60">
          <div className="w-full">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 border-b border-zinc-800/60">
                <tr>
                  <th className={thCls}>Subject</th>
                  <th className={`${thCls} hidden md:table-cell`}>Chapter</th>
                  <th className={thCls}>Module</th>
                  <th className={`${thRCls} hidden md:table-cell`}>Done</th>
                  <th className={thRCls}>Doubt</th>
                  <th className={`${thRCls} hidden md:table-cell`}>Revision</th>
                  <th className={thRCls}>Pending</th>
                  <th className={thCls}>Completion</th>
                  <th className={`${thRCls} hidden md:table-cell`}>Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {visible.map((r, idx) => {
                  const rowBg = idx % 2 === 0 ? "bg-zinc-950/20" : "bg-transparent";
                  const isBacklog = r.pending > 0 && r.completion_pct < 50;
                  return (
                    <tr
                      key={r.module_set_id}
                      className={`transition-colors hover:bg-zinc-900/40 ${rowBg}`}
                    >
                      {/* Subject */}
                      <td className="px-3 py-2.5 text-xs font-medium text-zinc-400">
                        {r.subject}
                      </td>

                      {/* Chapter — hidden on mobile */}
                      <td className="hidden px-3 py-2.5 text-xs text-zinc-500 md:table-cell">
                        {r.chapter}
                      </td>

                      {/* Module name */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium text-zinc-200">
                            {r.module_name}
                          </span>
                          {r.open_doubts > 0 && (
                            <span className="inline-flex items-center rounded bg-red-950/40 border border-red-900/50 px-1 py-0.5 text-[10px] font-semibold text-red-400">
                              {r.open_doubts}D
                            </span>
                          )}
                          {isBacklog && r.open_doubts === 0 && (
                            <span className="inline-flex items-center rounded bg-amber-950/40 border border-amber-900/50 px-1 py-0.5 text-[10px] font-semibold text-amber-500">
                              BACKLOG
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Done — hidden on mobile */}
                      <td className="hidden px-3 py-2.5 text-right font-mono text-xs tabular-nums text-emerald-400/90 md:table-cell">
                        {r.done}
                      </td>

                      {/* Doubt */}
                      <td
                        className={`px-3 py-2.5 text-right font-mono text-xs tabular-nums ${
                          r.doubt > 0 ? "text-amber-400/90" : "text-zinc-600"
                        }`}
                      >
                        {r.doubt}
                      </td>

                      {/* Revision — hidden on mobile */}
                      <td
                        className={`hidden px-3 py-2.5 text-right font-mono text-xs tabular-nums md:table-cell ${
                          r.revision > 0 ? "text-red-400/90" : "text-zinc-600"
                        }`}
                      >
                        {r.revision}
                      </td>

                      {/* Pending */}
                      <td
                        className={`px-3 py-2.5 text-right font-mono text-xs tabular-nums ${
                          r.pending > 0 ? "text-zinc-400" : "text-zinc-700"
                        }`}
                      >
                        {r.pending}
                      </td>

                      {/* Completion bar */}
                      <td className="px-3 py-2.5">
                        <CompletionBar pct={r.completion_pct} />
                      </td>

                      {/* Last updated — hidden on mobile */}
                      <td className="hidden px-3 py-2.5 text-right text-xs text-zinc-600 md:table-cell">
                        {r.last_updated
                          ? new Date(r.last_updated).toLocaleDateString(
                              "en-IN",
                              { day: "numeric", month: "short" },
                            )
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
