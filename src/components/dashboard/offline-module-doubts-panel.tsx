"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, BookOpen, Loader2 } from "lucide-react";
import type { ModuleDoubtNotification } from "@/types/modules";

export function OfflineModuleDoubtsPanel() {
  const [notifications, setNotifications] = useState<
    ModuleDoubtNotification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());

  const fetchNotifications = useCallback(() => {
    // Default: unresolved only, newest first (handled by API)
    fetch("/api/teacher/module-doubts")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function handleResolve(notifId: string) {
    // Optimistic remove
    setResolvingIds((prev) => new Set([...prev, notifId]));
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));

    try {
      const res = await fetch(`/api/teacher/module-doubts/${notifId}`, {
        method: "PATCH",
      });
      if (!res.ok) {
        // Rollback: refetch the full list
        fetchNotifications();
      }
    } catch {
      fetchNotifications();
    } finally {
      setResolvingIds((prev) => {
        const next = new Set(prev);
        next.delete(notifId);
        return next;
      });
    }
  }

  function statusBadge(status: "doubt" | "revision") {
    return status === "doubt" ? (
      <span className="rounded px-1.5 py-0.5 text-xs font-semibold bg-amber-500/15 text-amber-400">
        doubt
      </span>
    ) : (
      <span className="rounded px-1.5 py-0.5 text-xs font-semibold bg-red-500/15 text-red-400">
        revision
      </span>
    );
  }

  if (loading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">
            Offline Module Doubts
          </h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-white">
            Offline Module Doubts
          </h2>
          {notifications.length > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-400">
              {notifications.length}
            </span>
          )}
        </div>
        <span className="text-xs text-zinc-500">unresolved · newest first</span>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center rounded border border-zinc-800 bg-zinc-900/30">
          <BookOpen className="mb-2 h-8 w-8 text-zinc-700" />
          <p className="text-sm text-zinc-500">No unresolved module doubts.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-zinc-800">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                {["Student", "Module", "Q#", "Status", "Time", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 ${
                        h === "" || h === "Q#" || h === "Status" || h === "Time"
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {notifications.map((n, idx) => (
                <tr
                  key={n.id}
                  className={`border-b border-zinc-800/60 transition-colors hover:bg-zinc-900/40 ${
                    idx % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/20"
                  } ${resolvingIds.has(n.id) ? "opacity-40" : ""}`}
                >
                  <td className="px-3 py-2 font-medium text-white">
                    {n.student_name}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-zinc-300">{n.module_name}</span>
                    <br />
                    <span className="text-xs text-zinc-500">
                      {n.subject} · {n.chapter}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-300">
                    Q{n.question_number}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {statusBadge(n.status)}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-zinc-500">
                    {new Date(n.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      id={`resolve-notif-${n.id}`}
                      onClick={() => handleResolve(n.id)}
                      disabled={resolvingIds.has(n.id)}
                      className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 transition-colors hover:border-emerald-500/50 hover:text-emerald-400 disabled:opacity-40"
                      title="Mark resolved"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
