"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Megaphone, ChevronDown, ChevronUp, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Priority = "normal" | "important" | "urgent";

interface Announcement {
  id: string;
  batch_name: string;
  batch_code: string;
  title: string;
  body: string;
  priority: Priority;
  teacher_name: string;
  created_at: string;
  is_read: boolean;
}

const PRIORITY_BADGE: Record<Priority, string> = {
  normal:    "bg-zinc-800 text-zinc-400",
  important: "bg-amber-500/15 text-amber-300",
  urgent:    "bg-red-500/15 text-red-300",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  normal: "Normal",
  important: "Important",
  urgent: "Urgent",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/announcements", { credentials: "include" });
      const data = await res.json();
      if (data.success) setAnnouncements(data.announcements ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAnnouncements(); }, [loadAnnouncements]);

  async function markRead(id: string) {
    // Optimistic update
    setAnnouncements((prev) =>
      prev.map((a) => a.id === id ? { ...a, is_read: true } : a)
    );
    await fetch("/api/student/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcementId: id }),
    });
  }

  function toggleExpand(id: string, isRead: boolean) {
    const isOpening = expandedId !== id;
    setExpandedId(isOpening ? id : null);
    if (isOpening && !isRead) {
      markRead(id);
    }
  }

  const unreadCount = announcements.filter((a) => !a.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/student/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-violet-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Notices</h1>
            <p className="text-sm text-zinc-500">
              {loading
                ? "Loading…"
                : unreadCount > 0
                  ? `${unreadCount} unread notice${unreadCount !== 1 ? "s" : ""}`
                  : "All notices read"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-md bg-zinc-800/40" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-md border border-zinc-800 bg-zinc-900/40 py-16 text-center">
          <Megaphone className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
          <p className="text-zinc-400">No notices for your batch yet.</p>
        </div>
      ) : (
        <div className="rounded-md border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          {announcements.map((a) => (
            <div key={a.id}>
              <button
                type="button"
                onClick={() => toggleExpand(a.id, a.is_read)}
                className="w-full px-4 py-3.5 text-left hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Unread indicator */}
                  <span
                    className={cn(
                      "mt-0.5 h-2 w-2 flex-shrink-0 rounded-full",
                      a.is_read ? "bg-transparent" : "bg-violet-400"
                    )}
                    aria-label={a.is_read ? "Read" : "Unread"}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(
                        "font-medium text-sm",
                        a.is_read ? "text-zinc-300" : "text-white"
                      )}>
                        {a.title}
                      </span>
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-xs font-medium",
                        PRIORITY_BADGE[a.priority]
                      )}>
                        {PRIORITY_LABEL[a.priority]}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-zinc-500">
                      <span>{a.teacher_name}</span>
                      <span>·</span>
                      <span className="font-mono">{a.batch_code}</span>
                      <span>·</span>
                      <span>{formatDate(a.created_at)}</span>
                    </div>
                  </div>

                  {expandedId === a.id
                    ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-zinc-600" />
                    : <ChevronDown className="h-4 w-4 flex-shrink-0 text-zinc-600" />}
                </div>
              </button>

              {expandedId === a.id && (
                <div className="bg-zinc-900/60 border-t border-zinc-800 px-10 py-4">
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {a.body}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
