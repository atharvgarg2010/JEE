"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  MessageCircle,
  BookOpen,
  Pin,
  X,
} from "lucide-react";
import Link from "next/link";
import { NotificationItemSkeleton } from "@/components/skeletons/dashboard-skeletons";
import type { TeacherNotification } from "@/types/dashboard";

type NotificationDateFilter =
  | "all"
  | "last24h"
  | "last7d"
  | "thisMonth"
  | `month-${number}-${number}`;

export function TeacherNotificationsPanel() {
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replyOpenFor, setReplyOpenFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [dateFilter, setDateFilter] = useState<NotificationDateFilter>("all");

  const monthOptions = useMemo(() => {
    const months = new Map<string, string>();
    notifications.forEach((notification) => {
      const date = new Date(notification.created_at);
      if (Number.isNaN(date.getTime())) return;
      const value = `month-${date.getFullYear()}-${date.getMonth() + 1}`;
      const label = date.toLocaleDateString("default", {
        month: "long",
        year: "numeric",
      });
      months.set(value, label);
    });
    return Array.from(months.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => (a.value < b.value ? 1 : -1));
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const now = new Date();
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const cutoff7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return notifications.filter((notification) => {
      const createdAt = new Date(notification.created_at);
      if (Number.isNaN(createdAt.getTime())) return false;

      if (dateFilter === "last24h") {
        return createdAt >= cutoff24h;
      }

      if (dateFilter === "last7d") {
        return createdAt >= cutoff7d;
      }

      if (dateFilter === "thisMonth") {
        return (
          createdAt.getFullYear() === now.getFullYear() &&
          createdAt.getMonth() === now.getMonth()
        );
      }

      if (dateFilter.startsWith("month-")) {
        const [, year, month] = dateFilter.split("-");
        return (
          createdAt.getFullYear() === Number(year) &&
          createdAt.getMonth() === Number(month) - 1
        );
      }

      return true;
    });
  }, [notifications, dateFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/teacher/notifications", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        const message = data?.error ?? "Unable to load notifications";
        setNotifications([]);
        setError(message);
        return;
      }

      const notificationsPayload = Array.isArray(data.notifications)
        ? data.notifications
        : Array.isArray(data.data?.notifications)
        ? data.data.notifications
        : [];

      const normalizedNotifications: TeacherNotification[] = notificationsPayload.map((item: any) => ({
        id: String(item.id ?? ""),
        student_id: String(item.student_id ?? ""),
        student_name: String(item.student_name ?? item.student_id ?? "Student"),
        teacher_id: String(item.teacher_id ?? ""),
        question_id: String(item.question_id ?? ""),
        message: String(item.message ?? ""),
        chapter_name: item.chapter_name ?? null,
        read: Boolean(item.read),
        created_at: item.created_at ? String(item.created_at) : new Date().toISOString(),
      }));

      setNotifications(normalizedNotifications);
    } catch (loadError) {
      console.error("[TeacherNotificationsPanel] failed to load notifications", loadError);
      setError("Unable to load notifications. Please try again later.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string) {
    setActionLoading(id);
    setError(null);

    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );

    try {
      const res = await fetch("/api/teacher/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id, action: "read" }),
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        const message = data?.error ?? "Unable to mark notification as read.";
        setError(message);
        await load();
        return;
      }

      await load();
    } catch (actionError) {
      console.error("Failed to mark notification read", actionError);
      setError("Unable to mark notification as read. Please try again.");
      await load();
    } finally {
      setActionLoading(null);
    }
  }

  function togglePin(id: string) {
    console.warn("Pin action disabled: schema does not support pinned state.");
  }

  function openReply(id: string) {
    setReplyOpenFor(id);
    setReplyText("");
  }

  function closeReply() {
    setReplyOpenFor(null);
    setReplyText("");
  }

  const unread = filteredNotifications.filter((n) => !n.read).length;

  return (
    <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Bell className="h-5 w-5 text-violet-400" />
          Student requests
          {unread > 0 && (
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">
              {unread} new
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <label htmlFor="notification-date-filter" className="font-medium text-zinc-400">
            Show:
          </label>
          <select
            id="notification-date-filter"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value as NotificationDateFilter)}
            className="rounded-2xl border border-zinc-700/80 bg-zinc-950/90 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="all">All time</option>
            <option value="last24h">Last 24 hours</option>
            <option value="last7d">Last 7 days</option>
            <option value="thisMonth">This month</option>
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <NotificationItemSkeleton key={i} />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <p className="text-sm text-zinc-500">No notifications match this date range.</p>
      ) : (
        <div className="space-y-3 max-h-100 overflow-y-auto">
          {filteredNotifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl border p-4 transition-all ${
                  n.read
                    ? "border-zinc-800/60 bg-zinc-950/30 opacity-70"
                    : "border-violet-500/30 bg-violet-950/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <p className="font-medium text-white">{n.student_name}</p>
                    <p className="text-xs text-zinc-500">
                      {n.chapter_name ?? "Chapter"} · {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-zinc-300 mb-2">{n.message}</p>
                <p className="text-xs text-zinc-600 mb-3">
                  Question ID:{" "}
                  <Link
                    href={`/teacher/questions/${n.question_id}`}
                    className="text-violet-300 hover:text-violet-200"
                  >
                    {n.question_id}
                  </Link>
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openReply(n.id)}
                    title="Reply"
                    className="p-1.5 rounded-md bg-zinc-800/40 text-zinc-400 hover:bg-violet-500/20 hover:text-violet-300 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Coming soon"
                    className="p-1.5 rounded-md bg-zinc-800/40 text-zinc-500 cursor-not-allowed"
                  >
                    <BookOpen className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Pin action disabled"
                    className="p-1.5 rounded-md bg-zinc-800/40 text-zinc-500 cursor-not-allowed"
                  >
                    <Pin className="h-4 w-4" />
                  </button>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      disabled={actionLoading === n.id}
                      className="ml-auto text-xs px-2 py-1 rounded-md bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
          ))}
        </div>
      )}

      {replyOpenFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-zinc-800/80 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-violet-400">Reply to student</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Send a quick response</h3>
              </div>
              <button
                type="button"
                onClick={closeReply}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
                aria-label="Close reply modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              className="min-h-35 w-full resize-none rounded-3xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Write a short reply to the student..."
            />
            <div className="mt-4 flex flex-wrap items-center gap-3 justify-end">
              <button
                type="button"
                onClick={closeReply}
                className="rounded-full bg-zinc-800/80 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={closeReply}
                disabled={!replyText.trim()}
                className="rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
