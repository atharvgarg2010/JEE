"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Users, BookOpen, AlertCircle,
  UserPlus, Trash2, ChevronRight, CheckCircle2, XCircle,
} from "lucide-react";
import type { BatchWithStats, BatchTeacherRow, BatchStudentRow } from "@/lib/db/batches";

interface SubjectSlot {
  name: string;
  slug: string;
  id: string;
}

const SUBJECTS: SubjectSlot[] = [
  { name: "Physics", slug: "physics", id: "" },
  { name: "Chemistry", slug: "chemistry", id: "" },
  { name: "Mathematics", slug: "mathematics", id: "" },
];

interface TeacherOption {
  id: string;
  full_name: string | null;
  username: string;
  subject: string | null;
}

interface StudentOption {
  id: string;
  full_name: string | null;
  username: string;
  roll_number: string | null;
}

export default function AdminBatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();

  const [batch, setBatch] = useState<BatchWithStats | null>(null);
  const [teachers, setTeachers] = useState<BatchTeacherRow[]>([]);
  const [students, setStudents] = useState<BatchStudentRow[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  // Subject IDs fetched from API
  const [subjectMap, setSubjectMap] = useState<Record<string, string>>({});
  // All teachers (for assignment dropdown)
  const [allTeachers, setAllTeachers] = useState<TeacherOption[]>([]);
  // All students (for assignment dropdown)
  const [allStudents, setAllStudents] = useState<StudentOption[]>([]);

  const [assigning, setAssigning] = useState<string | null>(null); // subjectSlug being assigned
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [assigningStudent, setAssigningStudent] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Record<string, string>>({});
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadBatch = useCallback(async () => {
    setLoading(true);
    try {
      const [batchRes, studentsRes] = await Promise.all([
        fetch(`/api/admin/batches/${batchId}`).then((r) => r.json()),
        fetch(`/api/admin/batches/${batchId}/students?limit=50`).then((r) => r.json()),
      ]);
      setBatch(batchRes.batch);
      setTeachers(batchRes.teachers ?? []);
      setStudents(studentsRes.students ?? []);
      setTotalStudents(studentsRes.total ?? 0);

      // Removed overwriting of subjectMap so it maintains all subject IDs loaded from /api/student/subjects
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    loadBatch();
    // Load all teachers for assignment dropdown
    fetch("/api/admin/users?role=teacher")
      .then((r) => r.json())
      .then((d) => setAllTeachers(d.users ?? []))
      .catch(console.error);

    // Load all students for assignment dropdown
    fetch("/api/admin/users?role=student")
      .then((r) => r.json())
      .then((d) => setAllStudents(d.users ?? []))
      .catch(console.error);

    // Load subjects to get IDs
    fetch("/api/student/subjects")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, string> = {};
        for (const s of d.subjects ?? []) {
          map[s.slug] = s.id;
        }
        setSubjectMap(map);
      })
      .catch(console.error);
  }, [loadBatch]);

  const assignedMap = Object.fromEntries(teachers.map((t) => [t.subject_slug, t]));

  async function handleAssign(subjectSlug: string) {
    const teacherId = selectedTeacher[subjectSlug];
    const subjectId = subjectMap[subjectSlug];
    if (!teacherId || !subjectId) return;

    setAssigning(subjectSlug);
    try {
      const res = await fetch(`/api/admin/batches/${batchId}/teachers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: teacherId, subject_id: subjectId }),
      });
      if (res.ok) {
        setStatusMsg("Teacher assigned successfully");
        await loadBatch();
      } else {
        const d = await res.json();
        setStatusMsg(d.error ?? "Failed to assign teacher");
      }
    } finally {
      setAssigning(null);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  }

  async function handleRemove(subjectSlug: string) {
    const subjectId = subjectMap[subjectSlug];
    if (!subjectId) return;
    if (!confirm("Remove this teacher from the batch?")) return;

    try {
      const res = await fetch(`/api/admin/batches/${batchId}/teachers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_id: subjectId }),
      });
      if (res.ok) {
        setStatusMsg("Teacher removed");
        await loadBatch();
      }
    } finally {
      setTimeout(() => setStatusMsg(null), 3000);
    }
  }

  async function handleAssignStudent() {
    if (!selectedStudent) return;
    setAssigningStudent(true);
    try {
      const res = await fetch(`/api/admin/batches/${batchId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: selectedStudent }),
      });
      if (res.ok) {
        setStatusMsg("Student assigned successfully");
        setSelectedStudent("");
        await loadBatch();
      } else {
        const d = await res.json();
        setStatusMsg(d.error ?? "Failed to assign student");
      }
    } finally {
      setAssigningStudent(false);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  }

  async function toggleActive() {
    if (!batch) return;
    if (!confirm(`${batch.is_active ? "Archive" : "Restore"} this batch?`)) return;
    await fetch(`/api/admin/batches/${batchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !batch.is_active }),
    });
    await loadBatch();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-zinc-800" />
        <div className="h-40 animate-pulse rounded-2xl bg-zinc-800/50" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-800/50" />)}
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <XCircle className="mb-3 h-10 w-10 text-zinc-700" />
        <p className="text-zinc-400">Batch not found.</p>
        <Link href="/admin/batches" className="mt-3 text-sm text-violet-400 hover:text-violet-300">← Back to batches</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/admin/batches" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300">
          <ArrowLeft className="h-4 w-4" /> Batches
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{batch.name}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                batch.is_active ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-700/50 text-zinc-500"
              }`}>
                {batch.is_active ? "Active" : "Archived"}
              </span>
            </div>
            <p className="mt-1 font-mono text-sm text-zinc-500">{batch.code}</p>
            {batch.description && <p className="mt-1 text-sm text-zinc-400">{batch.description}</p>}
          </div>
          <button
            onClick={toggleActive}
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          >
            {batch.is_active ? "Archive Batch" : "Restore Batch"}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Students", value: batch.student_count, icon: Users },
          { label: "Teachers", value: `${batch.teacher_count}/3`, icon: BookOpen },
          { label: "Avg Accuracy", value: batch.avg_accuracy !== null ? `${batch.avg_accuracy}%` : "—", icon: CheckCircle2 },
          { label: "Open Doubts", value: batch.doubts_pending, icon: AlertCircle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4">
            <Icon className="mb-2 h-4 w-4 text-zinc-500" />
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="mt-0.5 text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Status message */}
      {statusMsg && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm text-violet-300">
          {statusMsg}
        </div>
      )}

      {/* Teacher Assignments */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Subject Teachers</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {["physics", "chemistry", "mathematics"].map((slug) => {
            const assigned = assignedMap[slug];
            const subjectName = slug.charAt(0).toUpperCase() + slug.slice(1);
            const subjectLabel = slug === "mathematics" ? "Mathematics" : subjectName;

            return (
              <div key={slug} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{subjectLabel}</p>

                {assigned ? (
                  <div>
                    <p className="font-semibold text-white">{assigned.teacher_name}</p>
                    <p className="text-xs text-zinc-500">@{assigned.teacher_username}</p>
                    <div className="mt-3 flex gap-2">
                      <select
                        id={`replace-teacher-${slug}`}
                        value={selectedTeacher[slug] ?? ""}
                        onChange={(e) => setSelectedTeacher((p) => ({ ...p, [slug]: e.target.value }))}
                        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 px-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                      >
                        <option value="">Replace with…</option>
                        {allTeachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.full_name ?? t.username}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssign(slug)}
                        disabled={!selectedTeacher[slug] || assigning === slug}
                        className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 hover:bg-violet-500 transition-colors"
                      >
                        {assigning === slug ? "…" : "Assign"}
                      </button>
                      <button
                        onClick={() => handleRemove(slug)}
                        className="rounded-lg border border-zinc-700 p-1.5 text-zinc-500 hover:border-red-500/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2 text-sm text-zinc-600">No teacher assigned</p>
                    <div className="flex gap-2">
                      <select
                        id={`assign-teacher-${slug}`}
                        value={selectedTeacher[slug] ?? ""}
                        onChange={(e) => setSelectedTeacher((p) => ({ ...p, [slug]: e.target.value }))}
                        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 px-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                      >
                        <option value="">Select teacher…</option>
                        {allTeachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.full_name ?? t.username}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssign(slug)}
                        disabled={!selectedTeacher[slug] || assigning === slug}
                        className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 hover:bg-violet-500 transition-colors"
                      >
                        <UserPlus className="h-3 w-3" />
                        {assigning === slug ? "…" : "Assign"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Students */}
      <div>
        <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-lg font-semibold text-white">
            Students <span className="ml-2 text-sm font-normal text-zinc-500">({totalStudents})</span>
          </h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="flex-1 sm:w-64 rounded-lg border border-zinc-700 bg-zinc-800 py-2 px-3 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none"
            >
              <option value="">Select student to assign…</option>
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name ?? s.username} {s.roll_number ? `(${s.roll_number})` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignStudent}
              disabled={!selectedStudent || assigningStudent}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-violet-500 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              {assigningStudent ? "Assigning…" : "Assign"}
            </button>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
            <Users className="mb-3 h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">No students enrolled yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-zinc-800/80 bg-zinc-900/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/80">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 whitespace-nowrap">Student</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 whitespace-nowrap">Roll No.</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 whitespace-nowrap">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {students.map((s) => (
                  <tr 
                    key={s.student_id} 
                    onClick={() => { window.location.href = `/admin/users/${s.student_id}`; }}
                    className="transition-colors hover:bg-zinc-800/30 cursor-pointer group"
                  >
                    <td className="px-5 py-3 whitespace-nowrap">
                      <p className="font-medium text-white group-hover:text-violet-400 transition-colors">{s.student_name}</p>
                      <p className="text-xs text-zinc-500">@{s.student_username}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-400 whitespace-nowrap">{s.roll_number ?? "—"}</td>
                    <td className="px-5 py-3 text-xs text-zinc-500 whitespace-nowrap">
                      {new Date(s.enrolled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalStudents > 50 && (
              <div className="border-t border-zinc-800/80 px-5 py-3 text-center text-xs text-zinc-500">
                Showing 50 of {totalStudents} students
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
