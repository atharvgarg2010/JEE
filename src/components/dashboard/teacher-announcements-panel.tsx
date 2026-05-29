"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

type Priority = "normal" | "important" | "urgent";

interface Announcement {
  id: string;
  batch_name: string;
  batch_code: string;
  title: string;
  priority: Priority;
  created_at: string;
  total_students: number;
  read_count: number;
}

const PRIORITY_BADGE: Record<Priority, string> = {
  normal:    "bg-zinc-800 text-zinc-400",
  important: "bg-amber-500/15 text-amber-300",
  urgent:    "bg-red-500/15 text-red-300",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export function TeacherAnnouncementsPanel() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/announcements");
      const data = await res.json();
      if (data.success) setAnnouncements((data.announcements ?? []).slice(0, 5));
    } catch {
      // non-critical widget
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <section className="space-y-3">
        <div className="h-6 w-40 animate-pulse rounded bg-zinc-800" />
        <div className="h-32 animate-pulse rounded-md bg-zinc-800/40" />
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Recent Announcements</h2>
        <Link
          href="/teacher/announcements"
          className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
        >
          View all →
        </Link>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-md border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-center">
          <p className="text-sm text-zinc-500">No announcements posted yet.</p>
          <Link
            href="/teacher/announcements"
            className="mt-2 block text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            Post first notice →
          </Link>
        </div>
      ) : (
        <div className="rounded-md border border-zinc-800 overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/60">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">Title</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell whitespace-nowrap">Batch</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell whitespace-nowrap">Priority</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">Reads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-900">
              {announcements.map((a) => {
                const pct = a.total_students > 0
                  ? Math.round((a.read_count / a.total_students) * 100)
                  : 0;
                return (
                  <tr key={a.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="truncate max-w-[12rem] font-medium text-zinc-100">{a.title}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">{formatDate(a.created_at)}</p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-400">{a.batch_code}</span>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", PRIORITY_BADGE[a.priority])}>
                        {a.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "font-mono text-sm font-semibold",
                        pct >= 70 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-zinc-400"
                      )}>
                        {a.read_count}/{a.total_students}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
