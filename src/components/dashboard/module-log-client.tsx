"use client";

/**
 * ModuleLogClient — Offline Module Question Logging System
 *
 * Architecture notes:
 * - Debounce-ready: status updates go through `flushPending()` which is
 *   designed to be wrapped in a debounce later. Currently fires immediately
 *   after optimistic update but the separation makes batching trivial to add.
 * - Memoization: QuestionCell is React.memo'd. Analytics derived via useMemo.
 * - Cascading dropdowns: subject → chapter → module, each reset downstream.
 * - Optimistic rollback: on API failure, reverts state and shows toast.
 * - No page-level x-scroll: grid wraps responsively.
 */

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  memo,
} from "react";
import { Loader2, Bell, CheckCircle2, AlertCircle } from "lucide-react";
import type {
  ModuleSet,
  ModuleQuestionLog,
  ModuleAnalytics,
  QuestionStatus,
} from "@/types/modules";

// ============================================================
// Status cycle & styling
// ============================================================

const STATUS_CYCLE: QuestionStatus[] = [
  "not_done",
  "done",
  "doubt",
  "revision",
];

function nextStatus(current: QuestionStatus): QuestionStatus {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

const STATUS_STYLES: Record<QuestionStatus, string> = {
  not_done:
    "border border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300",
  done: "border border-emerald-500/70 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30",
  doubt:
    "border border-amber-500/70 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25",
  revision:
    "border border-red-500/70 bg-red-500/15 text-red-300 hover:bg-red-500/25",
};

// ============================================================
// Toast
// ============================================================

interface Toast {
  id: number;
  message: string;
  type: "error" | "success" | "info";
}

// ============================================================
// QuestionCell — memoized to prevent grid rerenders
// ============================================================

interface QuestionCellProps {
  qNum: number;
  status: QuestionStatus;
  notified: boolean;
  onCycle: (qNum: number) => void;
  onNotify: (qNum: number, status: QuestionStatus) => void;
}

const QuestionCell = memo(function QuestionCell({
  qNum,
  status,
  notified,
  onCycle,
  onNotify,
}: QuestionCellProps) {
  const canNotify = status === "doubt" || status === "revision";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        id={`q-cell-${qNum}`}
        onClick={() => onCycle(qNum)}
        title={`Q${qNum}: ${status}`}
        className={`
          flex h-10 w-10 items-center justify-center
          rounded text-xs font-mono font-semibold tabular-nums
          transition-colors select-none
          ${STATUS_STYLES[status]}
        `}
        aria-label={`Question ${qNum} — ${status}`}
      >
        {qNum}
      </button>
      {canNotify && (
        <button
          id={`q-notify-${qNum}`}
          onClick={() => onNotify(qNum, status)}
          title={notified ? "Teacher notified" : "Notify teacher"}
          className={`
            flex h-5 w-5 items-center justify-center rounded transition-colors
            ${
              notified
                ? "text-zinc-600 cursor-default"
                : "text-zinc-600 hover:text-amber-400"
            }
          `}
          disabled={notified}
          aria-label={
            notified
              ? `Q${qNum}: teacher already notified`
              : `Notify teacher about Q${qNum}`
          }
        >
          <Bell className="h-3 w-3" />
        </button>
      )}
    </div>
  );
});

// ============================================================
// Analytics strip — memoized
// ============================================================

function AnalyticsStrip({ analytics }: { analytics: ModuleAnalytics }) {
  const chips = [
    {
      label: "Done",
      value: analytics.done,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Doubt",
      value: analytics.doubt,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Revision",
      value: analytics.revision,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Pending",
      value: analytics.not_done,
      color: "text-zinc-400",
      bg: "bg-zinc-800",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <div
          key={c.label}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 ${c.bg}`}
        >
          <span className={`text-xs font-mono font-bold tabular-nums ${c.color}`}>
            {c.value}
          </span>
          <span className="text-xs text-zinc-500">{c.label}</span>
        </div>
      ))}
      <div className="ml-auto flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1">
        <span className="text-xs font-mono font-bold tabular-nums text-white">
          {analytics.completion_pct}%
        </span>
        <span className="text-xs text-zinc-500">done</span>
      </div>
    </div>
  );
}

// ============================================================
// Skeleton
// ============================================================

function GridSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-10 animate-pulse rounded bg-zinc-800/60"
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main Client
// ============================================================

export function ModuleLogClient() {
  const [modules, setModules] = useState<ModuleSet[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);

  // Cascading dropdown state
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");

  // Log state
  const [logs, setLogs] = useState<Map<number, QuestionStatus>>(new Map());
  const [notifiedQuestions, setNotifiedQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [analytics, setAnalytics] = useState<ModuleAnalytics | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);

  // Toast system
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  function showToast(message: string, type: Toast["type"] = "error") {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }

  // ============================================================
  // Derived dropdown options
  // ============================================================

  const subjects = useMemo(
    () => [...new Set(modules.map((m) => m.subject))].sort(),
    [modules],
  );

  const chapters = useMemo(
    () =>
      [
        ...new Set(
          modules
            .filter((m) => m.subject === selectedSubject)
            .map((m) => m.chapter),
        ),
      ].sort(),
    [modules, selectedSubject],
  );

  const filteredModules = useMemo(
    () =>
      modules.filter(
        (m) =>
          m.subject === selectedSubject && m.chapter === selectedChapter,
      ),
    [modules, selectedSubject, selectedChapter],
  );

  const selectedModule = useMemo(
    () => modules.find((m) => m.id === selectedModuleId) ?? null,
    [modules, selectedModuleId],
  );

  // Derived question count
  const questionCount = selectedModule?.question_count ?? 0;

  // ============================================================
  // Load all modules on mount
  // ============================================================

  useEffect(() => {
    fetch("/api/student/modules")
      .then((r) => r.json())
      .then((d) => setModules(d.modules ?? []))
      .catch(() => showToast("Failed to load modules"))
      .finally(() => setModulesLoading(false));
  }, []);

  // ============================================================
  // Load logs when module selected
  // ============================================================

  useEffect(() => {
    if (!selectedModuleId) {
      setLogs(new Map());
      setAnalytics(null);
      setNotifiedQuestions(new Set());
      return;
    }

    setLogsLoading(true);
    fetch(`/api/student/modules/${selectedModuleId}/logs`)
      .then((r) => r.json())
      .then((d) => {
        const map = new Map<number, QuestionStatus>();
        (d.logs ?? []).forEach((l: ModuleQuestionLog) => {
          map.set(l.question_number, l.status);
        });
        setLogs(map);
        setAnalytics(d.analytics ?? null);
      })
      .catch(() => showToast("Failed to load question logs"))
      .finally(() => setLogsLoading(false));
  }, [selectedModuleId]);

  // ============================================================
  // Analytics derived from local state (memoized)
  // Used only when server analytics not yet available.
  // ============================================================

  const derivedAnalytics = useMemo<ModuleAnalytics>(() => {
    if (!selectedModule) {
      return { done: 0, doubt: 0, revision: 0, not_done: 0, total: 0, completion_pct: 0 };
    }
    let done = 0, doubt = 0, revision = 0;
    logs.forEach((s) => {
      if (s === "done") done++;
      else if (s === "doubt") doubt++;
      else if (s === "revision") revision++;
    });
    const not_done = Math.max(0, questionCount - done - doubt - revision);
    const completion_pct =
      questionCount > 0 ? Math.round((done / questionCount) * 100) : 0;
    return { done, doubt, revision, not_done, total: questionCount, completion_pct };
  }, [logs, questionCount, selectedModule]);

  const displayAnalytics = analytics ?? derivedAnalytics;

  // ============================================================
  // Pending flush — designed to be debounced later.
  // Currently fires immediately; swap `flushPending` with
  // `debounce(flushPending, 400)` to batch rapid clicks.
  // ============================================================

  const flushPending = useCallback(
    async (
      qNum: number,
      newStatus: QuestionStatus,
      previousStatus: QuestionStatus,
    ) => {
      try {
        const res = await fetch(
          `/api/student/modules/${selectedModuleId}/logs`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question_number: qNum,
              status: newStatus,
            }),
          },
        );
        if (!res.ok) {
          throw new Error("Server rejected update");
        }
        // Sync analytics from server response
        const data = await res.json();
        if (data.log) {
          // log saved successfully — analytics will be recomputed from local state
        }
      } catch {
        // Rollback on failure
        setLogs((prev) => {
          const next = new Map(prev);
          if (previousStatus === "not_done") {
            next.delete(qNum);
          } else {
            next.set(qNum, previousStatus);
          }
          return next;
        });
        showToast(`Q${qNum}: failed to save — reverted`, "error");
      }
    },
    [selectedModuleId],
  );

  const handleCycle = useCallback(
    (qNum: number) => {
      if (!selectedModuleId) return;

      const current = logs.get(qNum) ?? "not_done";
      const newStatus = nextStatus(current);

      // Optimistic update
      setLogs((prev) => {
        const next = new Map(prev);
        next.set(qNum, newStatus);
        return next;
      });
      // Invalidate server analytics — local derivedAnalytics will take over
      setAnalytics(null);

      // Fire API (debounce-ready: just call flushPending here or wrap in debounce)
      flushPending(qNum, newStatus, current);
    },
    [selectedModuleId, logs, flushPending],
  );

  const handleNotify = useCallback(
    async (qNum: number, status: QuestionStatus) => {
      if (!selectedModuleId || status === "not_done" || status === "done") return;

      try {
        const res = await fetch(
          `/api/student/modules/${selectedModuleId}/notify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question_number: qNum,
              status,
            }),
          },
        );
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error ?? "Failed to notify teacher", "error");
          return;
        }
        // Mark as notified (both new and existing)
        setNotifiedQuestions((prev) => new Set([...prev, qNum]));
        showToast(
          data.created
            ? `Teacher notified about Q${qNum}`
            : `Teacher already notified about Q${qNum}`,
          data.created ? "success" : "info",
        );
      } catch {
        showToast("Failed to send notification", "error");
      }
    },
    [selectedModuleId],
  );

  // ============================================================
  // Dropdown handlers (proper cascade reset)
  // ============================================================

  function handleSubjectChange(val: string) {
    setSelectedSubject(val);
    setSelectedChapter("");   // reset downstream
    setSelectedModuleId("");  // reset downstream
  }

  function handleChapterChange(val: string) {
    setSelectedChapter(val);
    setSelectedModuleId(""); // reset downstream
  }

  // ============================================================
  // Render
  // ============================================================

  const selectCls =
    "w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50 transition-colors";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Module Log</h1>
        <p className="mt-0.5 text-sm text-zinc-400">
          Track your progress on coaching modules and DPPs
        </p>
      </div>

      {/* Toast container */}
      <div className="fixed bottom-20 right-4 z-50 space-y-2 md:bottom-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded border px-3 py-2 text-xs font-medium shadow-lg animate-fade-in ${
              t.type === "error"
                ? "border-red-800 bg-zinc-900 text-red-400"
                : t.type === "success"
                ? "border-emerald-800 bg-zinc-900 text-emerald-400"
                : "border-zinc-700 bg-zinc-900 text-zinc-400"
            }`}
          >
            {t.type === "error" && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
            {t.type === "success" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
            {t.message}
          </div>
        ))}
      </div>

      {/* Module selector */}
      <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Select Module
        </p>
        {modulesLoading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading modules…
          </div>
        ) : modules.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No modules available yet. Ask your admin to create some.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Subject */}
            <div>
              <label
                htmlFor="sel-subject"
                className="mb-1 block text-xs text-zinc-400"
              >
                Subject
              </label>
              <select
                id="sel-subject"
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className={selectCls}
              >
                <option value="">— Select subject —</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter */}
            <div>
              <label
                htmlFor="sel-chapter"
                className="mb-1 block text-xs text-zinc-400"
              >
                Chapter
              </label>
              <select
                id="sel-chapter"
                value={selectedChapter}
                onChange={(e) => handleChapterChange(e.target.value)}
                disabled={!selectedSubject}
                className={selectCls}
              >
                <option value="">— Select chapter —</option>
                {chapters.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Module */}
            <div>
              <label
                htmlFor="sel-module"
                className="mb-1 block text-xs text-zinc-400"
              >
                Module
              </label>
              <select
                id="sel-module"
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                disabled={!selectedChapter}
                className={selectCls}
              >
                <option value="">— Select module —</option>
                {filteredModules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.module_name} ({m.question_count}Q)
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* No module selected empty state */}
      {!selectedModuleId && !modulesLoading && modules.length > 0 && (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded border border-zinc-800 bg-zinc-900">
            <span className="text-2xl font-bold text-zinc-700">#</span>
          </div>
          <p className="text-sm text-zinc-500">
            Select a subject, chapter, and module to begin logging.
          </p>
        </div>
      )}

      {/* Question grid + analytics */}
      {selectedModuleId && (
        <div className="space-y-4">
          {/* Analytics strip */}
          <AnalyticsStrip analytics={displayAnalytics} />

          {/* Status legend */}
          <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded border border-zinc-700 bg-zinc-900" />
              Not done
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded border border-emerald-500/70 bg-emerald-600/20" />
              Done
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded border border-amber-500/70 bg-amber-500/15" />
              Doubt
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded border border-red-500/70 bg-red-500/15" />
              Revision
            </span>
            <span className="ml-auto text-zinc-600">
              Click to cycle · <Bell className="inline h-3 w-3" /> to notify teacher
            </span>
          </div>

          {/* Question grid */}
          {logsLoading ? (
            <GridSkeleton />
          ) : (
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(40px, 40px))",
              }}
            >
              {Array.from({ length: questionCount }, (_, i) => i + 1).map(
                (qNum) => (
                  <QuestionCell
                    key={qNum}
                    qNum={qNum}
                    status={logs.get(qNum) ?? "not_done"}
                    notified={notifiedQuestions.has(qNum)}
                    onCycle={handleCycle}
                    onNotify={handleNotify}
                  />
                ),
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
