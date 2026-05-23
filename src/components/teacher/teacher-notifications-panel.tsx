"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TeacherNotification } from "@/types/dashboard";

export function TeacherNotificationsPanel() {
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/teacher/notifications", {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) setNotifications(data.notifications ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string) {
    await fetch("/api/teacher/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    load();
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Bell className="h-5 w-5 text-violet-400" />
          Student requests
          {unread > 0 && (
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">
              {unread} new
            </span>
          )}
        </h2>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-zinc-500">No student notifications yet.</p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-4 ${
                n.read
                  ? "border-zinc-800/60 bg-zinc-950/30 opacity-70"
                  : "border-violet-500/30 bg-violet-950/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{n.student_name}</p>
                  <p className="text-xs text-zinc-500">
                    {n.chapter_name ?? "Chapter"} ·{" "}
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                {!n.read && (
                  <Button size="sm" variant="secondary" onClick={() => markRead(n.id)}>
                    <Check className="h-4 w-4" />
                    Read
                  </Button>
                )}
              </div>
              <p className="mt-2 text-sm text-zinc-300">{n.message}</p>
              <p className="mt-1 text-xs text-zinc-600">Question ID: {n.question_id}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
