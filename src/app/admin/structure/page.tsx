"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, Edit2, Trash2, Layers, BookOpen, Save, X } from "lucide-react";
import type { Subject, Chapter } from "@/types/modules";

type Tab = "subjects" | "chapters";

export default function AdminStructurePage() {
  const [activeTab, setActiveTab] = useState<Tab>("subjects");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  // Chapter form state
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formName, setFormName] = useState("");
  const [formSortOrder, setFormSortOrder] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit chapter state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, chapRes] = await Promise.all([
        fetch("/api/admin/subjects"),
        fetch("/api/admin/chapters"),
      ]);
      const subData = await subRes.json();
      const chapData = await chapRes.json();
      setSubjects(subData.subjects ?? []);
      setChapters(chapData.chapters ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreateChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!formSubjectId || !formName.trim()) return;
    
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/admin/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: formSubjectId,
          name: formName.trim(),
          sort_order: formSortOrder ? parseInt(formSortOrder, 10) : 0,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setFormError(data.error ?? "Failed to create chapter");
        return;
      }
      
      setChapters(prev => [...prev, data.chapter].sort((a, b) => {
        if (a.subject_name !== b.subject_name) return (a.subject_name || "").localeCompare(b.subject_name || "");
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.name.localeCompare(b.name);
      }));
      
      setFormName("");
      setFormSortOrder("");
      setShowChapterForm(false);
    } catch {
      setFormError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateChapter(id: string) {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/admin/chapters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          sort_order: editSortOrder ? parseInt(editSortOrder, 10) : 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setChapters(prev => prev.map(c => c.id === id ? data.chapter : c).sort((a, b) => {
          if (a.subject_name !== b.subject_name) return (a.subject_name || "").localeCompare(b.subject_name || "");
          if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
          return a.name.localeCompare(b.name);
        }));
        setEditingId(null);
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to update");
      }
    } catch {
      alert("Network error");
    }
  }

  async function handleDeleteChapter(id: string) {
    if (!confirm("Are you sure you want to delete this chapter? This will fail if there are modules linked to it.")) return;
    try {
      const res = await fetch(`/api/admin/chapters/${id}`, { method: "DELETE" });
      if (res.ok) {
        setChapters(prev => prev.filter(c => c.id !== id));
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete");
      }
    } catch {
      alert("Network error");
    }
  }

  const inputCls = "w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none transition-colors";
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Academic Structure</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Manage subjects and chapters for module linking
          </p>
        </div>
      </div>

      <div className="flex space-x-1 rounded-lg bg-zinc-900/50 p-1 w-max border border-zinc-800">
        <button
          onClick={() => setActiveTab("subjects")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "subjects"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Subjects
        </button>
        <button
          onClick={() => setActiveTab("chapters")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "chapters"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
          }`}
        >
          <Layers className="h-4 w-4" />
          Chapters
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded border border-zinc-800 bg-zinc-900/50" />
          ))}
        </div>
      ) : activeTab === "subjects" ? (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded border border-zinc-800 overflow-x-auto">
            <table className="w-full min-w-[400px] text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Subject Name</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Created At</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub, idx) => (
                  <tr key={sub.id} className={`border-b border-zinc-800/60 transition-colors hover:bg-zinc-900/40 ${idx % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/20"}`}>
                    <td className="px-4 py-3 font-medium text-white">{sub.name}</td>
                    <td className="px-4 py-3 text-right text-zinc-500">
                      {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-500">Note: Core subjects (PCM) are currently fixed. Contact support to add more subjects.</p>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-end">
            <button
              onClick={() => setShowChapterForm(v => !v)}
              className="inline-flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:border-indigo-500 hover:bg-zinc-800 transition-colors"
            >
              {showChapterForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showChapterForm ? "Cancel" : "New Chapter"}
            </button>
          </div>

          {showChapterForm && (
            <form onSubmit={handleCreateChapter} className="rounded border border-indigo-500/30 bg-indigo-500/5 p-4 animate-fade-in">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-400">Add New Chapter</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Subject</label>
                  <select
                    value={formSubjectId}
                    onChange={e => setFormSubjectId(e.target.value)}
                    required
                    className={inputCls}
                  >
                    <option value="" disabled>Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Chapter Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    required
                    placeholder="e.g. Thermodynamics"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Order Index (Optional)</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={e => setFormSortOrder(e.target.value)}
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
              </div>
              {formError && <p className="mt-2 text-xs text-red-400">{formError}</p>}
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !formSubjectId || !formName.trim()}
                  className="inline-flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Chapter
                </button>
              </div>
            </form>
          )}

          {chapters.length === 0 ? (
            <div className="rounded border border-zinc-800 bg-zinc-900/30 py-12 text-center">
              <Layers className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
              <p className="text-sm text-zinc-400">No chapters added yet.</p>
            </div>
          ) : (
            <div className="rounded border border-zinc-800 overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Chapter Name</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">Order</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {chapters.map((chap, idx) => (
                    <tr key={chap.id} className={`border-b border-zinc-800/60 transition-colors hover:bg-zinc-900/40 ${idx % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/20"}`}>
                      <td className="px-4 py-3 text-zinc-400">{chap.subject_name}</td>
                      <td className="px-4 py-3 font-medium text-white">
                        {editingId === chap.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-white"
                          />
                        ) : (
                          chap.name
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-zinc-400">
                        {editingId === chap.id ? (
                          <input
                            type="number"
                            value={editSortOrder}
                            onChange={e => setEditSortOrder(e.target.value)}
                            className="w-16 mx-auto rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-center text-sm text-white"
                          />
                        ) : (
                          chap.sort_order
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingId === chap.id ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingId(null)} className="text-xs text-zinc-400 hover:text-white">Cancel</button>
                            <button onClick={() => handleUpdateChapter(chap.id)} className="text-xs font-medium text-indigo-400 hover:text-indigo-300">Save</button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingId(chap.id);
                                setEditName(chap.name);
                                setEditSortOrder(String(chap.sort_order));
                              }}
                              className="rounded border border-zinc-700 p-1.5 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
                              title="Edit Chapter"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(chap.id)}
                              className="rounded border border-zinc-700 p-1.5 text-zinc-500 hover:border-red-500/40 hover:text-red-400 transition-colors"
                              title="Delete Chapter"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
