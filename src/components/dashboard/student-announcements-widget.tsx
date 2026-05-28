"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

type Priority = "normal" | "important" | "urgent";

interface Announcement {
  id: string;
  batch_code: string;
  title: string;
  priority: Priority;
  teacher_name: string;
  created_at: string;
  is_read: boolean;
}

const PRIORITY_DOT: Record<Priority, string> = {
  normal: "bg-zinc-600",
  important: "bg-amber-400",
  urgent: "bg-red-400",
};

export function StudentAnnouncementsWidget() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/student/announcements", { credentials: "include" });
      const data = await res.json();
      if (data.success) setAnnouncements(data.announcements ?? []);
    } catch {
      // silently fail — widget is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unreadCount = announcements.filter((a) => !a.is_read).length;
  const preview = announcements.slice(0, 3);

  if (loading) {
    return (
      <section className="space-y-2">
        <div className="h-6 w-32 animate-pulse rounded bg-zinc-800" />
        <div className="h-12 animate-pulse rounded-md bg-zinc-800/40" />
        <div className="h-12 animate-pulse rounded-md bg-zinc-800/40" />
      </section>
    );
  }

  if (announcements.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-white">Notices</h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-semibold text-violet-300 ring-1 ring-violet-500/30">
              {unreadCount} new
            </span>
          )}
        </div>
        <Link
          href="/student/announcements"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          View all →
        </Link>
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
        {preview.map((a) => (
          <Link
            key={a.id}
            href="/student/announcements"
            className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors"
          >
            <span
              className={cn(
                "h-1.5 w-1.5 flex-shrink-0 rounded-full",
                a.is_read ? "bg-transparent" : "bg-violet-400"
              )}
            />
            <span
              className={cn(
                "flex-1 truncate text-sm",
                a.is_read ? "text-zinc-400" : "font-medium text-zinc-100"
              )}
            >
              {a.title}
            </span>
            <span
              className={cn(
                "h-1.5 w-1.5 flex-shrink-0 rounded-full",
                PRIORITY_DOT[a.priority]
              )}
              title={a.priority}
            />
          </Link>
        ))}
        {announcements.length > 3 && (
          <Link
            href="/student/announcements"
            className="block px-4 py-2.5 text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            +{announcements.length - 3} more notices
          </Link>
        )}
      </div>
    </section>
  );
}
