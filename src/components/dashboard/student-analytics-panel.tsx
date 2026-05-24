"use client";

import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentCard } from "./student-card";
import { StudentAnalyticsPanelSkeleton } from "@/components/skeletons/dashboard-skeletons";
import type { TeacherStudentAnalyticsBuckets } from "@/types/teacher-analytics";

const EMPTY_MESSAGES: Record<
  keyof TeacherStudentAnalyticsBuckets,
  { title: string; description: string }
> = {
  top: {
    title: "No top performers yet",
    description:
      "Students need more attempts on your questions with strong accuracy and mastery.",
  },
  weak: {
    title: "No weak students flagged",
    description:
      "No students currently show low accuracy or high mistake counts on your content.",
  },
  improving: {
    title: "No improvement trends yet",
    description:
      "Compare weekly accuracy once students have attempts in both recent and prior periods.",
  },
  inactive: {
    title: "No inactive students",
    description:
      "All students with activity on your questions have practiced within the last 7 days.",
  },
};

function EmptyTabState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-700/80 bg-zinc-900/30 px-6 py-12 text-center">
      <Users className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
      <p className="font-medium text-zinc-300">{title}</p>
      <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">{description}</p>
    </div>
  );
}

function StudentGrid({
  students,
  variant,
  empty,
}: {
  students: TeacherStudentAnalyticsBuckets[keyof TeacherStudentAnalyticsBuckets];
  variant: "top" | "weak" | "improving" | "inactive";
  empty: { title: string; description: string };
}) {
  if (students.length === 0) {
    return <EmptyTabState title={empty.title} description={empty.description} />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {students.map((student) => (
        <StudentCard key={student.id} student={student} variant={variant} />
      ))}
    </div>
  );
}

export function StudentAnalyticsPanel() {
  const [activeTab, setActiveTab] = useState("top");
  const [analytics, setAnalytics] =
    useState<TeacherStudentAnalyticsBuckets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/student-analytics", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        setError(data.error ?? "Failed to load student analytics");
      }
    } catch {
      setError("Failed to load student analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <StudentAnalyticsPanelSkeleton />;
  }

  if (error || !analytics) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Student Analytics</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Track student performance and engagement
          </p>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error ?? "Unable to load analytics"}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-white">Student Analytics</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Live performance from students who practiced your questions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-zinc-900/50 border border-zinc-800/60 p-1 rounded-lg">
          <TabsTrigger value="top" className="text-xs">
            🔥 Top
          </TabsTrigger>
          <TabsTrigger value="weak" className="text-xs">
            ⚠️ Weak
          </TabsTrigger>
          <TabsTrigger value="improving" className="text-xs">
            📈 Improving
          </TabsTrigger>
          <TabsTrigger value="inactive" className="text-xs">
            😴 Inactive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top" className="mt-4">
          <StudentGrid
            students={analytics.top}
            variant="top"
            empty={EMPTY_MESSAGES.top}
          />
        </TabsContent>

        <TabsContent value="weak" className="mt-4">
          <StudentGrid
            students={analytics.weak}
            variant="weak"
            empty={EMPTY_MESSAGES.weak}
          />
        </TabsContent>

        <TabsContent value="improving" className="mt-4">
          <StudentGrid
            students={analytics.improving}
            variant="improving"
            empty={EMPTY_MESSAGES.improving}
          />
        </TabsContent>

        <TabsContent value="inactive" className="mt-4">
          <StudentGrid
            students={analytics.inactive}
            variant="inactive"
            empty={EMPTY_MESSAGES.inactive}
          />
        </TabsContent>
      </Tabs>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={load}
          className="text-sm text-violet-400 hover:text-violet-300 font-medium"
        >
          Refresh analytics →
        </button>
      </div>
    </section>
  );
}
