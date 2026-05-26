"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { Users, Search } from "lucide-react";
import type { BatchWithStats, BatchStudentRow } from "@/lib/db/batches";

export default function TeacherStudentsPage() {
  const searchParams = useSearchParams();
  const initialBatch = searchParams.get("batch") ?? "";

  const [batches, setBatches] = useState<BatchWithStats[]>([]);
  const [selectedBatch, setSelectedBatch] = useState(initialBatch);
  const [students, setStudents] = useState<BatchStudentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [search, setSearch] = useState("");

  // Load teacher's batches
  useEffect(() => {
    fetch("/api/teacher/batches")
      .then((r) => r.json())
      .then((d) => {
        const b = d.batches ?? [];
        setBatches(b);
        if (!selectedBatch && b.length > 0) {
          setSelectedBatch(b[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingBatches(false));
  }, []);

  // Load students when batch changes
  useEffect(() => {
    if (!selectedBatch) return;
    setLoadingStudents(true);
    fetch(`/api/admin/batches/${selectedBatch}/students?limit=100`)
      .then((r) => r.json())
      .then((d) => {
        setStudents(d.students ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoadingStudents(false));
  }, [selectedBatch]);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.student_name.toLowerCase().includes(q) ||
      s.student_username.toLowerCase().includes(q) ||
      (s.roll_number?.toLowerCase().includes(q) ?? false)
    );
  });

  const currentBatch = batches.find((b) => b.id === selectedBatch);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Students</h1>
        <p className="mt-1 text-zinc-400">
          {currentBatch ? `${currentBatch.name} · ${total} students` : "Select a batch"}
        </p>
      </div>

      {/* Batch selector */}
      {!loadingBatches && batches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {batches.map((b) => (
            <button
              key={b.id}
              id={`batch-btn-${b.id}`}
              onClick={() => setSelectedBatch(b.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                selectedBatch === b.id
                  ? "bg-violet-600 text-white"
                  : "border border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {b.name}
              <span className={`ml-2 text-xs ${selectedBatch === b.id ? "text-violet-300" : "text-zinc-600"}`}>
                {b.student_count}
              </span>
            </button>
          ))}
        </div>
      )}

      {batches.length === 0 && !loadingBatches && (
        <div className="flex flex-col items-center rounded-2xl border border-zinc-800/80 bg-zinc-900/30 py-16 text-center">
          <Users className="mb-4 h-12 w-12 text-zinc-700" />
          <p className="text-zinc-400">Not assigned to any batches yet.</p>
        </div>
      )}

      {/* Search */}
      {students.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            id="student-search"
            type="text"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none"
          />
        </div>
      )}

      {/* Student list */}
      {loadingStudents ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-800/50" />
          ))}
        </div>
      ) : selectedBatch && filtered.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/80">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Student</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Roll No.</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {filtered.map((s) => (
                <tr key={s.student_id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-white">{s.student_name}</p>
                    <p className="text-xs text-zinc-500">@{s.student_username}</p>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-zinc-400">{s.roll_number ?? "—"}</td>
                  <td className="px-5 py-3.5 text-xs text-zinc-500">
                    {new Date(s.enrolled_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selectedBatch && !loadingStudents ? (
        <div className="flex flex-col items-center rounded-2xl border border-zinc-800/80 bg-zinc-900/30 py-12 text-center">
          <Users className="mb-3 h-8 w-8 text-zinc-700" />
          <p className="text-sm text-zinc-500">
            {search ? "No students match your search." : "No students enrolled in this batch yet."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
