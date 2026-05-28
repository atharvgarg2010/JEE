"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { Megaphone, Send, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BatchWithStats } from "@/lib/db/batches";

type Priority = "normal" | "important" | "urgent";
type Tab = "compose" | "sent" | "analytics";
type BatchTarget = "specific" | "all";

interface Announcement {
  id: string;
  batch_id: string;
  batch_name: string;
  batch_code: string;
  title: string;
  body: string;
  priority: Priority;
  created_at: string;
  total_students: number;
  read_count: number;
}

const PRIORITY_BADGE: Record<Priority, string> = {
  normal:    "bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700",
  important: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  urgent:    "bg-red-500/15 text-red-300 ring-1 ring-red-500/30",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  normal: "Normal",
  important: "Important",
  urgent: "Urgent",
};

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", PRIORITY_BADGE[priority])}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ReadBar({ read, total }: { read: number; total: number }) {
  const pct = total > 0 ? Math.round((read / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 rounded-full bg-zinc-800">
        <div
          className="h-1 rounded-full bg-violet-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-zinc-400">
        {read} / {total}
      </span>
    </div>
  );
}

export default function TeacherAnnouncementsPage() {
  const [tab, setTab] = useState<Tab>("compose");
  const [batches, setBatches] = useState<BatchWithStats[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [batchTarget, setBatchTarget] = useState<BatchTarget>("specific");
  const [batchId, setBatchId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");

  // Expandable rows in Sent tab
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/teacher/batches").then((r) => r.json()),
      fetch("/api/teacher/announcements").then((r) => r.json()),
    ])
      .then(([batchData, annData]) => {
        const b: BatchWithStats[] = batchData.batches ?? [];
        setBatches(b);
        if (b.length > 0 && !batchId) setBatchId(b[0].id);
        setAnnouncements(annData.announcements ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    if (batchTarget === "specific" && !batchId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/teacher/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_target: batchTarget, batch_id: batchId, title, body, priority }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to post announcement");
        return;
      }
      const count = data.inserted as number;
      setSuccess(
        count === 1
          ? "Announcement posted successfully."
          : `Announcement posted to ${count} batches.`
      );
      setTitle("");
      setBody("");
      setPriority("normal");
      // Reload announcements and switch to Sent tab
      const ann = await fetch("/api/teacher/announcements").then((r) => r.json());
      setAnnouncements(ann.announcements ?? []);
      setTab("sent");
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "compose", label: "Compose" },
    { id: "sent", label: `Sent (${announcements.length})` },
    { id: "analytics", label: "Analytics" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Megaphone className="h-6 w-6 text-violet-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Announcements</h1>
          <p className="text-sm text-zinc-500">Broadcast notices to your assigned batches</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setError(null); setSuccess(null); }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === t.id
                ? "border-violet-500 text-violet-300"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── COMPOSE TAB ── */}
      {tab === "compose" && (
        <div className="rounded-md border border-zinc-800 bg-zinc-900">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">Loading batches…</div>
          ) : batches.length === 0 ? (
            <div className="p-8 text-center">
              <Megaphone className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
              <p className="text-zinc-400">You are not assigned to any batches yet.</p>
              <p className="mt-1 text-sm text-zinc-600">Contact admin to be assigned.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="divide-y divide-zinc-800">
              {/* Target type */}
              <div className="p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Target</p>
                <div className="flex flex-wrap gap-3">
                  {(["specific", "all"] as BatchTarget[]).map((t) => (
                    <label
                      key={t}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors",
                        batchTarget === t
                          ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
                          : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      <input
                        type="radio"
                        name="batch_target"
                        value={t}
                        checked={batchTarget === t}
                        onChange={() => setBatchTarget(t)}
                        className="sr-only"
                      />
                      {t === "specific" ? "Specific Batch" : "All My Batches"}
                      {t === "all" && (
                        <span className="ml-1 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500">
                          {batches.length} batch{batches.length !== 1 ? "es" : ""}
                        </span>
                      )}
                    </label>
                  ))}
                </div>

                {batchTarget === "specific" && (
                  <div>
                    <label htmlFor="ann-batch" className="mb-1.5 block text-xs font-medium text-zinc-400">
                      Select batch
                    </label>
                    <select
                      id="ann-batch"
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                      className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code}) — {b.student_count} students
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Priority</p>
                <div className="flex flex-wrap gap-2">
                  {(["normal", "important", "urgent"] as Priority[]).map((p) => (
                    <label
                      key={p}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors",
                        priority === p
                          ? PRIORITY_BADGE[p]
                          : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                      )}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={priority === p}
                        onChange={() => setPriority(p)}
                        className="sr-only"
                      />
                      {PRIORITY_LABEL[p]}
                    </label>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="p-5">
                <label htmlFor="ann-title" className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  id="ann-title"
                  type="text"
                  required
                  maxLength={200}
                  placeholder="e.g. DPP 12 uploaded — Chapter 4 Mechanics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                />
                <p className="mt-1 text-right text-xs text-zinc-600">{title.length}/200</p>
              </div>

              {/* Body */}
              <div className="p-5">
                <label htmlFor="ann-body" className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="ann-body"
                  required
                  rows={5}
                  maxLength={5000}
                  placeholder="Write your announcement here…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                />
                <p className="mt-1 text-right text-xs text-zinc-600">{body.length}/5000</p>
              </div>

              {/* Errors / Success */}
              {error && (
                <div className="mx-5 mb-0 rounded-md border border-red-500/30 bg-red-950/30 px-4 py-2.5 text-sm text-red-400">
                  {error}
                </div>
              )}
              {success && (
                <div className="mx-5 mb-0 rounded-md border border-emerald-500/30 bg-emerald-950/30 px-4 py-2.5 text-sm text-emerald-400">
                  {success}
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-3 p-5">
                <button
                  type="button"
                  onClick={() => { setTitle(""); setBody(""); setPriority("normal"); setError(null); setSuccess(null); }}
                  className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !body.trim()}
                  className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Posting…" : batchTarget === "all" ? `Post to all ${batches.length} batches` : "Post announcement"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── SENT TAB ── */}
      {tab === "sent" && (
        <div className="rounded-md border border-zinc-800">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">Loading…</div>
          ) : announcements.length === 0 ? (
            <div className="p-8 text-center">
              <Megaphone className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
              <p className="text-zinc-400">No announcements posted yet.</p>
              <button
                onClick={() => setTab("compose")}
                className="mt-2 text-sm font-medium text-violet-400 hover:text-violet-300"
              >
                Compose your first →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto w-full pb-2">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-900/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">Title</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Priority</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">Sent</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:table-cell">Reads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {announcements.map((a) => (
                    <Fragment key={a.id}>
                      <tr
                        className="cursor-pointer hover:bg-zinc-800/30 transition-colors"
                        onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {expandedId === a.id
                              ? <ChevronUp className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0" />
                              : <ChevronDown className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0" />}
                            <span className="font-medium text-zinc-100 truncate max-w-[18rem] block">{a.title}</span>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 sm:table-cell">
                          <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-400">{a.batch_code}</span>
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={a.priority} />
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-zinc-500 md:table-cell whitespace-nowrap">
                          {formatDate(a.created_at)}
                        </td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          <ReadBar read={a.read_count} total={a.total_students} />
                        </td>
                      </tr>
                      {expandedId === a.id && (
                        <tr className="bg-zinc-900/40">
                          <td colSpan={5} className="px-8 py-4">
                            <div className="flex flex-wrap gap-4 text-xs text-zinc-500 mb-3">
                              <span>Batch: <span className="text-zinc-300">{a.batch_name}</span></span>
                              <span>Sent: <span className="text-zinc-300">{formatDate(a.created_at)}</span></span>
                              <span>Read: <span className="text-zinc-300">{a.read_count}/{a.total_students}</span></span>
                            </div>
                            <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{a.body}</p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab === "analytics" && (
        <div className="rounded-md border border-zinc-800">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">Loading…</div>
          ) : announcements.length === 0 ? (
            <div className="p-8 text-center">
              <Megaphone className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
              <p className="text-zinc-400">No data yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full pb-2">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-900/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Priority</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Sent</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Students</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Read</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {announcements.map((a) => {
                    const pct = a.total_students > 0
                      ? Math.round((a.read_count / a.total_students) * 100)
                      : 0;
                    return (
                      <tr key={a.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-zinc-100 max-w-[14rem] truncate block">{a.title}</td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-400">{a.batch_code}</span>
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={a.priority} />
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">{formatDate(a.created_at)}</td>
                        <td className="hidden sm:table-cell px-4 py-3 text-right font-mono text-zinc-300">{a.total_students}</td>
                        <td className="hidden sm:table-cell px-4 py-3 text-right font-mono text-zinc-300">{a.read_count}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            "font-mono text-sm font-semibold",
                            pct >= 70 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-red-400"
                          )}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
