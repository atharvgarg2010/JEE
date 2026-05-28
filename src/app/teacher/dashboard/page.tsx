import Link from "next/link";
import {
  BookOpen,
  FileQuestion,
  Layers,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentAnalyticsPanel } from "@/components/dashboard/student-analytics-panel";
import { QuestionInsightsPanel } from "@/components/dashboard/question-insights-panel";
import { BatchOverviewPanel } from "@/components/dashboard/batch-overview-panel";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { getCurrentUser } from "@/lib/auth/session";
import { getTeacherQuestionStats } from "@/lib/db/questions";
import { TeacherAnnouncementsPanel } from "@/components/dashboard/teacher-announcements-panel";

export const metadata = {
  title: "Teacher Dashboard | JEE Tracker",
};

export default async function TeacherDashboardPage() {
  const user = await getCurrentUser();
  const stats = user ? await getTeacherQuestionStats(user.id) : null;

  return (
    <div className="space-y-10">
      <div className="rounded-md border border-zinc-800 bg-zinc-900 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Teacher Command Center
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Welcome back, {user?.full_name?.split(" ")[0] ?? user?.username}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" asChild>
            <Link href="/teacher/questions">View question bank</Link>
          </Button>
          <Button asChild>
            <Link href="/teacher/questions/new">
              <Plus className="h-4 w-4" />
              New question
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total questions",
            value: stats?.total_questions ?? 0,
            icon: FileQuestion,
            accent: "text-violet-400",
          },
          {
            label: "MCQ",
            value: stats?.mcq_count ?? 0,
            icon: Layers,
            accent: "text-fuchsia-400",
          },
          {
            label: "Integer",
            value: stats?.integer_count ?? 0,
            icon: Target,
            accent: "text-cyan-400",
          },
          {
            label: "Categories",
            value: stats?.by_category.filter((c) => c.count > 0).length ?? 0,
            icon: BookOpen,
            accent: "text-amber-400",
          },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 p-4"
          >
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                {label}
              </p>
              <p className="mt-1 text-2xl font-bold text-zinc-100">{value}</p>
            </div>
            <Icon className="h-6 w-6 text-indigo-400 opacity-80" />
          </div>
        ))}
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsPanel />

      {/* Announcements Panel */}
      <TeacherAnnouncementsPanel />

      {/* Student Analytics Panel */}
      <StudentAnalyticsPanel />

      {/* NEW: Question Insights Panel */}
      <QuestionInsightsPanel />

      {/* NEW: Batch Overview Panel */}
      <BatchOverviewPanel />

      {/* Student Requests are now handled by navbar notifications drawer */}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Questions by category
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(stats?.by_category ?? []).map((cat) => (
            <div
              key={cat.name}
              className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 p-4"
            >
              <span className="text-sm text-zinc-300">{cat.name}</span>
              <span className="rounded-lg bg-violet-500/15 px-2.5 py-1 text-sm font-semibold text-violet-300">
                {cat.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Solved Examples & DPP",
            desc: "Build conceptual drills and daily practice",
            href: "/teacher/questions/new",
          },
          {
            title: "JEE Main / Advanced",
            desc: "Prabal & Parikshit style questions",
            href: "/teacher/questions/new",
          },
          {
            title: "Created by Teacher",
            desc: "Easy, Medium, Hard custom sets",
            href: "/teacher/questions/new",
          },
        ].map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-md border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:bg-zinc-800/50"
          >
            <h3 className="font-semibold text-white">{card.title}</h3>
            <p className="mt-2 text-sm text-zinc-500">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
