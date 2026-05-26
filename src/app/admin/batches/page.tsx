"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus, Layers, Users, AlertCircle,
  ChevronRight, Search, ToggleLeft, ToggleRight,
} from "lucide-react";
import type { BatchWithStats } from "@/lib/db/batches";

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<BatchWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetch("/api/admin/batches")
      .then((r) => r.json())
      .then((data) => setBatches(data.batches ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = batches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase());
    const matchesActive = showInactive ? true : b.is_active;
    return matchesSearch && matchesActive;
  });

  const active = batches.filter((b) => b.is_active).length;
  const totalStudents = batches.reduce((s, b) => s + b.student_count, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Batches</h1>
          <p className="mt-1 text-zinc-400">
            {active} active · {batches.length} total · {totalStudents} students enrolled
          </p>
        </div>
        <Link
          href="/admin/batches/new"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
        >
          <Plus className="h-4 w-4" />
          New Batch
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            id="batch-search"
            type="text"
            placeholder="Search batches…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowInactive((v) => !v)}
          className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          {showInactive ? (
            <ToggleRight className="h-4 w-4 text-violet-400" />
          ) : (
            <ToggleLeft className="h-4 w-4" />
          )}
          Show archived
        </button>
      </div>

      {/* Batch Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-zinc-800/50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Layers className="mb-4 h-12 w-12 text-zinc-700" />
          <p className="text-zinc-400">No batches found.</p>
          <Link
            href="/admin/batches/new"
            className="mt-3 text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            Create the first batch →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <Link
              key={b.id}
              href={`/admin/batches/${b.id}`}
              className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 transition-all hover:border-violet-500/40 hover:bg-zinc-900"
            >
              {/* Status badge */}
              <div className="absolute right-4 top-4">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    b.is_active
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-zinc-700/50 text-zinc-500"
                  }`}
                >
                  {b.is_active ? "Active" : "Archived"}
                </span>
              </div>

              <h3 className="pr-16 font-semibold text-white group-hover:text-violet-300 transition-colors">
                {b.name}
              </h3>
              <p className="mt-0.5 text-xs font-mono text-zinc-500">{b.code}</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-zinc-800/60 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Users className="h-3.5 w-3.5" />
                    Students
                  </div>
                  <p className="mt-0.5 text-lg font-bold text-white">{b.student_count}</p>
                </div>
                <div className="rounded-xl bg-zinc-800/60 px-3 py-2">
                  <p className="text-xs text-zinc-500">Teachers</p>
                  <p className={`mt-0.5 text-lg font-bold ${b.teacher_count >= 3 ? "text-emerald-400" : "text-amber-400"}`}>
                    {b.teacher_count}<span className="text-xs text-zinc-600 font-normal">/3</span>
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-800/60 px-3 py-2">
                  <p className="text-xs text-zinc-500">Avg Accuracy</p>
                  <p className={`mt-0.5 text-lg font-bold ${
                    b.avg_accuracy === null ? "text-zinc-600" :
                    b.avg_accuracy >= 70 ? "text-emerald-400" :
                    b.avg_accuracy >= 50 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {b.avg_accuracy !== null ? `${b.avg_accuracy}%` : "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-800/60 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Doubts
                  </div>
                  <p className={`mt-0.5 text-lg font-bold ${b.doubts_pending > 0 ? "text-red-400" : "text-zinc-600"}`}>
                    {b.doubts_pending}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end text-xs text-zinc-600 group-hover:text-violet-400 transition-colors">
                Manage <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
