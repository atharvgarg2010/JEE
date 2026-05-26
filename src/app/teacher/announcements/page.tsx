"use client";

import { useState, useEffect } from "react";
import { Megaphone, Plus, Send, X } from "lucide-react";
import type { BatchWithStats } from "@/lib/db/batches";

interface Announcement {
  id: string;
  batch_id: string;
  batch_name: string;
  batch_code: string;
  title: string;
  body: string;
  created_at: string;
}

export default function TeacherAnnouncementsPage() {
  const [batches, setBatches] = useState<BatchWithStats[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ batch_id: "", title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/teacher/batches").then((r) => r.json()),
      fetch("/api/teacher/announcements").then((r) => r.json()),
    ])
      .then(([batchData, annData]) => {
        const b = batchData.batches ?? [];
        setBatches(b);
        setAnnouncements(annData.announcements ?? []);
        if (b.length > 0 && !form.batch_id) {
          setForm((p) => ({ ...p, batch_id: b[0].id }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!form.batch_id || !form.title.trim() || !form.body.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/teacher/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to post announcement");
        return;
      }

      // Refresh announcements
      const updated = await fetch("/api/teacher/announcements").then((r) => r.json());
      setAnnouncements(updated.announcements ?? []);
      setForm((p) => ({ ...p, title: "", body: "" }));
      setShowForm(false);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Announcements</h1>
          <p className="mt-1 text-zinc-400">
            Broadcast messages to your assigned batches
          </p>
        </div>
        {!showForm && batches.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            <Plus className="h-4 w-4" />
            New Announcement
          </button>
        )}
      </div>

      {/* Compose Form */}
      {showForm && (
        <div className="rounded-2xl border border-violet-500/30 bg-zinc-900/70 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">New Announcement</h2>
            <button
              onClick={() => { setShowForm(false); setError(null); }}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handlePost} className="space-y-4">
            <div>
              <label htmlFor="ann-batch" className="mb-1.5 block text-sm font-medium text-zinc-300">
                Batch <span className="text-red-400">*</span>
              </label>
              <select
                id="ann-batch"
                value={form.batch_id}
                onChange={(e) => setForm((p) => ({ ...p, batch_id: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ann-title" className="mb-1.5 block text-sm font-medium text-zinc-300">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                id="ann-title"
                type="text"
                required
                placeholder="e.g. DPP 12 uploaded — Chapter 4 Mechanics"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="ann-body" className="mb-1.5 block text-sm font-medium text-zinc-300">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                id="ann-body"
                required
                rows={4}
                placeholder="Write your announcement here…"
                value={form.body}
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(null); }}
                className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Sending…" : "Post Announcement"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* No batches state */}
      {!loading && batches.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-zinc-800/80 bg-zinc-900/30 py-16 text-center">
          <Megaphone className="mb-4 h-12 w-12 text-zinc-700" />
          <p className="text-zinc-400">You haven&apos;t been assigned to any batches yet.</p>
          <p className="mt-2 text-sm text-zinc-600">Contact admin to get assigned to batches.</p>
        </div>
      )}

      {/* Announcements Feed */}
      {!loading && announcements.length === 0 && batches.length > 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-zinc-800/80 bg-zinc-900/30 py-16 text-center">
          <Megaphone className="mb-4 h-10 w-10 text-zinc-700" />
          <p className="text-zinc-400">No announcements posted yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            Post your first announcement →
          </button>
        </div>
      )}

      {!loading && announcements.length > 0 && (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{a.title}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-300">
                      {a.batch_name}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {new Date(a.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-zinc-300 whitespace-pre-wrap">{a.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
