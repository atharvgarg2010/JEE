"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, BookOpen, Loader2, ChevronDown, ChevronUp, Trash2, AlertTriangle, Link as LinkIcon, X } from "lucide-react";
import type { ModuleSet, Subject, Chapter } from "@/types/modules";

export default function AdminModulesPage() {
  const [modules, setModules] = useState<ModuleSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);

  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [questionCount, setQuestionCount] = useState("");

  // Auto-link state
  const [showAutoLink, setShowAutoLink] = useState(false);
  const [autoLinkPreview, setAutoLinkPreview] = useState<any>(null);
  const [autoLinkLoading, setAutoLinkLoading] = useState(false);
  const [autoLinkExecuting, setAutoLinkExecuting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [modRes, subRes, chapRes] = await Promise.all([
        fetch("/api/admin/modules"),
        fetch("/api/admin/subjects"),
        fetch("/api/admin/chapters"),
      ]);
      const modData = await modRes.json();
      const subData = await subRes.json();
      const chapData = await chapRes.json();
      
      setModules(modData.modules ?? []);
      setSubjects(subData.subjects ?? []);
      setAllChapters(chapData.chapters ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const availableChapters = useMemo(() => {
    if (!subjectId) return [];
    return allChapters.filter((c) => c.subject_id === subjectId);
  }, [subjectId, allChapters]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter_id: chapterId,
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
      setSubjectId("");
      setChapterId("");
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

  async function handlePreviewAutoLink() {
    setShowAutoLink(true);
    setAutoLinkLoading(true);
    setAutoLinkPreview(null);
    try {
      const res = await fetch("/api/admin/modules/auto-link");
      const data = await res.json();
      if (res.ok) setAutoLinkPreview(data.preview);
      else alert(data.error ?? "Failed to load preview");
    } catch {
      alert("Network error.");
    } finally {
      setAutoLinkLoading(false);
    }
  }

  async function handleExecuteAutoLink() {
    if (!confirm("Are you sure you want to apply these mappings?")) return;
    setAutoLinkExecuting(true);
    try {
      const res = await fetch("/api/admin/modules/auto-link", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully mapped ${data.updated} modules!`);
        setShowAutoLink(false);
        fetchData(); // refresh table
      } else {
        alert(data.error ?? "Failed to execute auto-link");
      }
    } catch {
      alert("Network error.");
    } finally {
      setAutoLinkExecuting(false);
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
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviewAutoLink}
            className="inline-flex items-center gap-2 rounded border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
          >
            <LinkIcon className="h-4 w-4" />
            Auto-Link Orphans
          </button>
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
              <select
                id="mod-subject"
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setChapterId(""); // reset chapter on subject change
                }}
                required
                className={inputCls}
              >
                <option value="" disabled>Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="mod-chapter" className={labelCls}>
                Chapter
              </label>
              <select
                id="mod-chapter"
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                required
                disabled={!subjectId}
                className={inputCls}
              >
                <option value="" disabled>
                  {subjectId ? "Select Chapter" : "Select Subject First"}
                </option>
                {availableChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
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
                    {!m.chapter_id && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-500" title="Unlinked chapter. Needs manual fix in DB.">
                        <AlertTriangle className="h-3 w-3" />
                        Unlinked
                      </span>
                    )}
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

      {/* Auto-Link Modal */}
      {showAutoLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <h2 className="text-lg font-semibold text-white">Auto-Link Orphan Modules</h2>
              <button onClick={() => setShowAutoLink(false)} className="text-zinc-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {autoLinkLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
                  <p className="text-sm text-zinc-400">Analyzing unlinked modules...</p>
                </div>
              ) : autoLinkPreview ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-center">
                      <p className="text-3xl font-bold text-green-400">{autoLinkPreview.matchedCount}</p>
                      <p className="text-xs font-medium uppercase tracking-wider text-green-500/70 mt-1">Ready to Link</p>
                    </div>
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-center">
                      <p className="text-3xl font-bold text-red-400">{autoLinkPreview.unmatchedCount}</p>
                      <p className="text-xs font-medium uppercase tracking-wider text-red-500/70 mt-1">Cannot Link</p>
                    </div>
                  </div>

                  {autoLinkPreview.matchedCount > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-white mb-2">Preview: Matched Modules</h3>
                      <div className="rounded border border-zinc-800 bg-zinc-900/30 max-h-40 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-zinc-900/60 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-zinc-400 font-medium">Module</th>
                              <th className="px-3 py-2 text-zinc-400 font-medium">Old Subj/Chap</th>
                              <th className="px-3 py-2 text-green-400 font-medium">New Chapter ID</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/50">
                            {autoLinkPreview.matched.map((m: any) => (
                              <tr key={m.moduleId}>
                                <td className="px-3 py-2 text-zinc-300">{m.moduleName}</td>
                                <td className="px-3 py-2 text-zinc-500">{m.oldSubject} / {m.oldChapter}</td>
                                <td className="px-3 py-2 font-mono text-green-500/80">{m.newChapterId}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {autoLinkPreview.unmatchedCount > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-white mb-2">Preview: Unmatched Modules</h3>
                      <p className="text-xs text-zinc-500 mb-2">These modules require manual editing because exact string matching failed.</p>
                      <div className="rounded border border-zinc-800 bg-zinc-900/30 max-h-40 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-zinc-900/60 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-zinc-400 font-medium">Module</th>
                              <th className="px-3 py-2 text-zinc-400 font-medium">Old Subj/Chap</th>
                              <th className="px-3 py-2 text-red-400 font-medium">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/50">
                            {autoLinkPreview.unmatched.map((m: any) => (
                              <tr key={m.moduleId}>
                                <td className="px-3 py-2 text-zinc-300">{m.moduleName}</td>
                                <td className="px-3 py-2 text-zinc-500">{m.oldSubject} / {m.oldChapter}</td>
                                <td className="px-3 py-2 text-red-400/80">{m.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
            
            <div className="border-t border-zinc-800 bg-zinc-900/50 px-5 py-4 flex items-center justify-end gap-3 rounded-b-lg">
              <button 
                onClick={() => setShowAutoLink(false)}
                className="rounded border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAutoLink}
                disabled={autoLinkLoading || autoLinkExecuting || !autoLinkPreview || autoLinkPreview.matchedCount === 0}
                className="inline-flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                {autoLinkExecuting && <Loader2 className="h-4 w-4 animate-spin" />}
                Execute Auto-Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
