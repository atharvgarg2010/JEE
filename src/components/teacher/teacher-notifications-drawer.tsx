"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Check, BookOpen, X } from "lucide-react";
import Link from "next/link";
import type { TeacherNotification } from "@/types/dashboard";

type NotificationDateFilter =
  | "all"
  | "last24h"
  | "last7d"
  | "thisMonth"
  | `month-${number}-${number}`;

type TeacherNotificationApiItem = {
  id?: string;
  student_id?: string;
  student_name?: string;
  teacher_id?: string;
  question_id?: string;
  message?: string;
  chapter_name?: string | null;
  read?: boolean;
  created_at?: string;
};

export function TeacherNotificationsDrawer() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);
  const [dateFilter, setDateFilter] = useState<NotificationDateFilter>("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/teacher/notifications", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setError(data?.error ?? "Unable to load notifications.");
        setNotifications([]);
        return;
      }

      const payload = Array.isArray(data.notifications)
        ? (data.notifications as TeacherNotificationApiItem[])
        : Array.isArray(data.data?.notifications)
        ? (data.data.notifications as TeacherNotificationApiItem[])
        : [];

      setNotifications(
        payload.map((item) => ({
          id: String(item.id ?? ""),
          student_id: String(item.student_id ?? ""),
          student_name: String(item.student_name ?? item.student_id ?? "Student"),
          teacher_id: String(item.teacher_id ?? ""),
          question_id: String(item.question_id ?? ""),
          message: String(item.message ?? ""),
          chapter_name: item.chapter_name ?? null,
          read: Boolean(item.read),
          created_at: item.created_at ? String(item.created_at) : new Date().toISOString(),
        })),
      );
    } catch (loadError) {
      console.error("[TeacherNotificationsDrawer] load failed", loadError);
      setError("Unable to load notifications. Please try again later.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchNotifications() {
      await loadNotifications();
    }

    void fetchNotifications();
  }, []);

  const unreadCount = useMemo(
    () => filteredNotifications.filter((notification) => !notification.read).length,
    [filteredNotifications],
  );

  const openDrawer = () => setOpen(true);
  const closeDrawer = () => setOpen(false);

  async function markRead(notificationId: string) {
    setActionLoading(notificationId);
    setError(null);
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      ),
    );

    try {
      const res = await fetch("/api/teacher/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, action: "read" }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setError(data?.error ?? "Unable to mark notification as read.");
        await loadNotifications();
        return;
      }
      await loadNotifications();
    } catch (err) {
      console.error("[TeacherNotificationsDrawer] markRead failed", err);
      setError("Unable to mark notification as read. Please try again.");
      await loadNotifications();
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-200 transition-colors hover:border-violet-500 hover:text-white"
        aria-label="Teacher notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      <div
        className={`fixed inset-0 z-100 transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      >
        <button
          type="button"
          onClick={closeDrawer}
          className="absolute inset-0 bg-black/60"
          tabIndex={-1}
        />
      </div>

      <aside
        className={`fixed inset-y-0 right-0 z-110 flex h-screen w-full max-w-[min(100%,28rem)] flex-col border-l border-zinc-800/80 bg-zinc-950 shadow-2xl shadow-black/50 transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-3 border-b border-zinc-800/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-violet-400">Notifications</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Teacher updates</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-300">Filter</span>
            <select
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
            <button
              type="button"
              onClick={closeDrawer}
              className="rounded-full border border-zinc-700 bg-zinc-900/80 p-2 text-zinc-300 transition-colors hover:border-violet-500 hover:text-white sm:hidden"
              aria-label="Close notifications drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-3xl bg-zinc-900/70"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-500/20 bg-red-950/50 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/80 p-6 text-center text-sm text-zinc-400">
              No notifications match this date range.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-3xl border p-4 transition-all ${
                    notification.read
                      ? "border-zinc-800/70 bg-zinc-900/70"
                      : "border-violet-500/20 bg-violet-950/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{notification.student_name}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {notification.chapter_name ?? "Chapter"} · {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-x-2 text-right text-xs">
                      {!notification.read && (
                        <span className="rounded-full bg-violet-500/15 px-2 py-1 text-violet-300">
                          Unread
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-zinc-300">{notification.message}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/teacher/questions/${notification.question_id}`}
                      className="rounded-full bg-zinc-900/80 px-3 py-2 text-sm text-violet-300 transition-colors hover:bg-zinc-800 hover:text-white"
                    >
                      <BookOpen className="mr-2 inline-block h-4 w-4" />
                      View question
                    </Link>
                    <button
                      type="button"
                      onClick={() => markRead(notification.id)}
                      disabled={actionLoading === notification.id || notification.read}
                      className="rounded-full bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Check className="mr-2 inline-block h-4 w-4" />
                      Mark read
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-800/80 px-5 py-4 text-sm text-zinc-500">
          Notifications are updated in real time when actions succeed.
        </div>
      </aside>
    </>
  );
}
