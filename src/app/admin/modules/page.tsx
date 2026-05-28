"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, BookOpen, Loader2, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { ModuleSet } from "@/types/modules";

export default function AdminModulesPage() {
  const [modules, setModules] = useState<ModuleSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [questionCount, setQuestionCount] = useState("");

  const fetchModules = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/modules")
      .then((r) => r.json())
      .then((d) => setModules(d.modules ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          chapter: chapter.trim(),
          module_name: moduleName.trim(),
          question_count: parseInt(questionCount, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Failed to create module");
        return;
      }
      // Prepend to list
      setModules((prev) => [data.module, ...prev]);
      // Reset form
      setSubject("");
      setChapter("");
      setModuleName("");
      setQuestionCount("");
      setShowForm(false);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Are you sure you want to delete this module? This will permanently delete all associated student logs and notifications."
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/modules/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to delete module");
        return;
      }
      setModules((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const inputCls =
    "w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none transition-colors";
  const labelCls = "block text-xs font-medium text-zinc-400 mb-1";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Module Sets</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            {modules.length} module{modules.length !== 1 ? "s" : ""} · offline
            coaching tracker
          </p>
        </div>
        <button
          id="admin-modules-new-btn"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-indigo-500 hover:bg-zinc-800"
        >
          {showForm ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New Module
            </>
          )}
        </button>
      </div>

      {/* Inline create form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded border border-zinc-700 bg-zinc-900 p-4 animate-fade-in"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Create Module Set
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="mod-subject" className={labelCls}>
                Subject
              </label>
              <input
                id="mod-subject"
                type="text"
                placeholder="e.g. Mathematics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                maxLength={100}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="mod-chapter" className={labelCls}>
                Chapter
              </label>
              <input
                id="mod-chapter"
                type="text"
                placeholder="e.g. Trigonometric Functions"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                required
                maxLength={200}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="mod-name" className={labelCls}>
                Module Name
              </label>
              <input
                id="mod-name"
                type="text"
                placeholder="e.g. DPP-I"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                required
                maxLength={200}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="mod-qcount" className={labelCls}>
                Question Count
              </label>
              <input
                id="mod-qcount"
                type="number"
                placeholder="e.g. 10"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                required
                min={1}
                max={1000}
                className={inputCls}
              />
            </div>
          </div>

          {formError && (
            <p className="mt-2 text-xs text-red-400">{formError}</p>
          )}

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormError(null);
              }}
              className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              id="mod-submit-btn"
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Module
            </button>
          </div>
        </form>
      )}

      {/* Module table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded border border-zinc-800 bg-zinc-900/50"
            />
          ))}
        </div>
      ) : modules.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <BookOpen className="mb-3 h-10 w-10 text-zinc-700" />
          <p className="text-sm text-zinc-500">No module sets yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-sm font-medium text-indigo-400 hover:text-indigo-300"
          >
            Create the first module →
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-zinc-800">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Subject
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Chapter
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Module
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Questions
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Created
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m, idx) => (
                <tr
                  key={m.id}
                  className={`border-b border-zinc-800/60 transition-colors hover:bg-zinc-900/40 ${
                    idx % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/20"
                  }`}
                >
                  <td className="px-4 py-2.5 font-medium text-white">
                    {m.subject}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-300">{m.chapter}</td>
                  <td className="px-4 py-2.5 text-zinc-300">{m.module_name}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-400">
                    {m.question_count}
                  </td>
                  <td className="px-4 py-2.5 text-right text-zinc-500">
                    {new Date(m.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(m.id)}
                      disabled={deletingId === m.id}
                      className="rounded border border-zinc-700 p-1.5 text-zinc-500 hover:border-red-500/40 hover:text-red-400 transition-colors disabled:opacity-40"
                      title="Delete Module Set"
                    >
                      {deletingId === m.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
