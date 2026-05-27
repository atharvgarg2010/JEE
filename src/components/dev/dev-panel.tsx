"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DEV_USERS, ROLE_COLORS, ROLE_HOME, type DevUser } from "@/lib/dev/dev-users";
import { LogIn, ChevronDown, ChevronUp, Zap, X, Loader2 } from "lucide-react";

/**
 * DEV-ONLY floating account switcher panel.
 *
 * Mounted in the root layout only when NODE_ENV === "development".
 * Tree-shaken out of production builds entirely.
 *
 * On click:
 *   1. POST /api/dev/switch with { userId }
 *   2. router.push(redirectTo) → full Server Component re-render with new cookie
 */
export function DevPanel() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<DevUser | null>(null);

  async function switchTo(user: DevUser) {
    setError(null);
    setActiveId(user.id);

    try {
      const res = await fetch("/api/dev/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Switch failed");
        setActiveId(null);
        return;
      }

      setCurrentUser(user);
      setIsOpen(false);

      // Full navigation → triggers Server Component re-render with new cookie.
      // This naturally clears all React state, timers, and in-flight fetches.
      startTransition(() => {
        router.push(ROLE_HOME[user.role]);
        router.refresh();
      });
    } catch {
      setError("Network error — is the dev server running?");
      setActiveId(null);
    }
  }

  async function clearSession() {
    setError(null);
    setActiveId("__clear__");

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setIsOpen(false);
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } catch {
      setError("Logout failed");
    } finally {
      setActiveId(null);
    }
  }

  const isLoading = isPending || activeId !== null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
      {/* ── Expanded Panel ─────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="w-64 rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60"
          style={{ backdropFilter: "blur(12px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                Dev Switch
              </span>
            </div>
            {currentUser && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${ROLE_COLORS[currentUser.role]}`}
              >
                {currentUser.label}
              </span>
            )}
          </div>

          {/* User Buttons */}
          <div className="flex flex-col gap-1 p-2">
            {DEV_USERS.map((u) => {
              const isThisLoading = activeId === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => switchTo(u)}
                  disabled={isLoading}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${ROLE_COLORS[u.role]}`}
                >
                  <div>
                    <p className="font-semibold">{u.label}</p>
                    {u.description && (
                      <p className="mt-0.5 text-[10px] opacity-70">
                        {u.description}
                      </p>
                    )}
                  </div>
                  {isThisLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin opacity-70" />
                  ) : (
                    <LogIn className="h-3.5 w-3.5 opacity-50" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Error message */}
          {error && (
            <div className="mx-2 mb-2 rounded border border-red-900/60 bg-red-950/40 px-2 py-1.5 text-[10px] text-red-400">
              {error}
            </div>
          )}

          {/* Clear Session */}
          <div className="border-t border-zinc-800 p-2">
            <button
              onClick={clearSession}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activeId === "__clear__" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
              Clear Dev Session
            </button>
          </div>
        </div>
      )}

      {/* ── Toggle Pill Button ─────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-yellow-700/60 bg-yellow-950/80 px-3 py-1.5 text-xs font-semibold text-yellow-400 shadow-lg shadow-black/40 transition-all hover:bg-yellow-900/80"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <Zap className="h-3.5 w-3.5" />
        DEV
        {isOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronUp className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}
