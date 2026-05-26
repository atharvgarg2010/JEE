"use client";

import { useState, useEffect } from "react";
import {
  BarChart2, Layers, Users, BookOpen,
  AlertCircle, Activity, TrendingUp, GraduationCap
} from "lucide-react";
import type {
  AdminDashboardStats, BatchPerformanceStat,
  TeacherPerformanceStat, StudentRanking, TeacherLoad
} from "@/lib/db/admin-analytics";

type AnalyticsView = "dashboard" | "batches" | "teachers" | "students";

export default function AdminAnalyticsClient() {
  const [view, setView] = useState<AnalyticsView>("dashboard");
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = view === "teachers" ? "teachers" : view;
    fetch(`/api/admin/analytics?view=${params}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [view]);

  const tabs: { key: AnalyticsView; label: string; icon: React.ElementType }[] = [
    { key: "dashboard", label: "Overview", icon: BarChart2 },
    { key: "batches", label: "Batches", icon: Layers },
    { key: "teachers", label: "Teachers", icon: Users },
    { key: "students", label: "Students", icon: GraduationCap },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-zinc-400">Cross-batch performance and platform health</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1 w-fit flex-wrap">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              view === key ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-800/50" />
          ))}
        </div>
      ) : (
        <>
          {/* Overview */}
          {view === "dashboard" && (() => {
            const stats = data.stats as AdminDashboardStats | undefined;
            if (!stats) return null;
            return (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Active Batches", value: stats.active_batches, sub: `${stats.total_batches} total`, icon: Layers, color: "text-violet-400" },
                  { label: "Students", value: stats.total_students, icon: GraduationCap, color: "text-cyan-400" },
                  { label: "Teachers", value: stats.total_teachers, icon: Users, color: "text-fuchsia-400" },
                  { label: "Questions", value: stats.total_questions, icon: BookOpen, color: "text-amber-400" },
                  { label: "Open Doubts", value: stats.total_doubts_unresolved, icon: AlertCircle, color: stats.total_doubts_unresolved > 20 ? "text-red-400" : "text-emerald-400" },
                  { label: "Total Attempts", value: stats.total_attempts.toLocaleString(), icon: Activity, color: "text-blue-400" },
                ].map(({ label, value, sub, icon: Icon, color }) => (
                  <div key={label} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5">
                    <Icon className={`mb-3 h-5 w-5 ${color}`} />
                    <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
                    <p className="mt-1 text-3xl font-bold text-white">{value}</p>
                    {sub && <p className="mt-0.5 text-xs text-zinc-600">{sub}</p>}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Batches */}
          {view === "batches" && (() => {
            const batches = data.batches as BatchPerformanceStat[] | undefined;
            if (!batches?.length) return <p className="text-zinc-500 text-sm">No batch data.</p>;
            return (
              <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800/80">
                      {["Batch", "Students", "Teachers", "Avg Accuracy", "Attempts", "Open Doubts"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {batches.map((b) => (
                      <tr key={b.batch_id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-white">{b.batch_name}</p>
                          <p className="text-xs font-mono text-zinc-500">{b.batch_code}</p>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-300">{b.student_count}</td>
                        <td className="px-5 py-3.5">
                          <span className={b.teacher_count >= 3 ? "text-emerald-400" : "text-amber-400"}>
                            {b.teacher_count}/3
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {b.avg_accuracy !== null ? (
                            <span className={b.avg_accuracy >= 70 ? "text-emerald-400 font-medium" : b.avg_accuracy >= 50 ? "text-amber-400 font-medium" : "text-red-400 font-medium"}>
                              {b.avg_accuracy}%
                            </span>
                          ) : <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-300">{b.total_attempts.toLocaleString()}</td>
                        <td className="px-5 py-3.5">
                          {b.doubts_pending > 0
                            ? <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400">{b.doubts_pending}</span>
                            : <span className="text-zinc-600">0</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Teachers */}
          {view === "teachers" && (() => {
            const teachers = data.teachers as TeacherPerformanceStat[] | undefined;
            const load = data.load as TeacherLoad[] | undefined;
            if (!teachers?.length) return <p className="text-zinc-500 text-sm">No teacher data.</p>;
            return (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800/80">
                        {["Teacher", "Subject", "Batches", "Students", "Questions", "Avg Student Acc.", "Open Doubts"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      {teachers.map((t) => (
                        <tr key={t.teacher_id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-white">{t.teacher_name}</td>
                          <td className="px-4 py-3">
                            {t.subject ? (
                              <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs text-cyan-300">{t.subject}</span>
                            ) : <span className="text-zinc-600">—</span>}
                          </td>
                          <td className="px-4 py-3 text-zinc-300">{t.batches_count}</td>
                          <td className="px-4 py-3 text-zinc-300">{t.students_count}</td>
                          <td className="px-4 py-3 text-zinc-300">{t.questions_authored}</td>
                          <td className="px-4 py-3">
                            {t.avg_student_accuracy !== null
                              ? <span className={t.avg_student_accuracy >= 70 ? "text-emerald-400 font-medium" : t.avg_student_accuracy >= 50 ? "text-amber-400 font-medium" : "text-red-400 font-medium"}>
                                  {t.avg_student_accuracy}%
                                </span>
                              : <span className="text-zinc-600">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {t.unresolved_doubts > 0
                              ? <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400">{t.unresolved_doubts}</span>
                              : <span className="text-zinc-600">0</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {load && load.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-base font-semibold text-white">Load Distribution</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {load.map((l) => (
                        <div key={l.teacher_id} className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
                          <p className="font-medium text-white">{l.teacher_name}</p>
                          {l.subject && <p className="text-xs text-zinc-500 mb-2">{l.subject}</p>}
                          <div className="mt-2 space-y-1 text-xs text-zinc-400">
                            <p><span className="text-zinc-600">Students:</span> <span className="text-white font-medium">{l.total_students}</span></p>
                            <p><span className="text-zinc-600">Batches:</span> {l.batches.join(", ") || "—"}</p>
                            <p><span className="text-zinc-600">Questions:</span> <span className="text-white font-medium">{l.questions_authored}</span></p>
                            {l.unresolved_doubts > 0 && (
                              <p className="text-red-400"><AlertCircle className="inline h-3 w-3 mr-1" />{l.unresolved_doubts} open doubts</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Students */}
          {view === "students" && (() => {
            const students = data.students as StudentRanking[] | undefined;
            if (!students?.length) return <p className="text-zinc-500 text-sm">No student data (need 3+ attempts per student).</p>;
            return (
              <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50">
                <div className="border-b border-zinc-800/60 px-5 py-3">
                  <p className="text-sm text-zinc-400">
                    Cross-batch rankings <span className="text-zinc-600">· sorted by accuracy (min. 3 attempts)</span>
                  </p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800/80">
                      {["#", "Student", "Batch", "Accuracy", "Questions", "30d Activity"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {students.map((s) => (
                      <tr key={s.student_id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-3.5 text-zinc-600 font-mono text-xs">#{s.rank}</td>
                        <td className="px-5 py-3.5 font-medium text-white">{s.student_name}</td>
                        <td className="px-5 py-3.5">
                          {s.batch_name
                            ? <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-300">{s.batch_name}</span>
                            : <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`font-semibold ${s.accuracy >= 70 ? "text-emerald-400" : s.accuracy >= 50 ? "text-amber-400" : "text-red-400"}`}>
                            {s.accuracy}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-300">{s.questions_attempted}</td>
                        <td className="px-5 py-3.5">
                          {s.streak > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                              <TrendingUp className="h-3.5 w-3.5" /> {s.streak} active days
                            </span>
                          ) : <span className="text-zinc-600 text-xs">Inactive</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
