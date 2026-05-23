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
import { TeacherNotificationsPanel } from "@/components/teacher/teacher-notifications-panel";
import { getCurrentUser } from "@/lib/auth/session";
import { getTeacherQuestionStats } from "@/lib/db/questions";

export const metadata = {
  title: "Teacher Dashboard | JEE Tracker",
};

export default async function TeacherDashboardPage() {
  const user = await getCurrentUser();
  const stats = user ? await getTeacherQuestionStats(user.id) : null;

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/50 via-zinc-900/80 to-zinc-950 p-8 sm:p-10">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="mb-2 flex items-center gap-2 text-sm text-violet-300">
            <Sparkles className="h-4 w-4" />
            Teacher Command Center
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Welcome back, {user?.full_name?.split(" ")[0] ?? user?.username}
          </h1>
          <p className="mt-3 max-w-xl text-zinc-400">
            Create JEE-aligned questions, organize by chapter and category, and
            build your institute&apos;s question bank.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/teacher/questions/new">
                <Plus className="h-4 w-4" />
                New question
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/teacher/questions">View question bank</Link>
            </Button>
          </div>
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
            className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm"
          >
            <Icon className={`mb-3 h-5 w-5 ${accent}`} />
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              {label}
            </p>
            <p className="mt-1 text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <TeacherNotificationsPanel />

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Questions by category
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(stats?.by_category ?? []).map((cat) => (
            <div
              key={cat.name}
              className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-3"
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
            className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 transition-colors hover:border-violet-500/40"
          >
            <h3 className="font-semibold text-white">{card.title}</h3>
            <p className="mt-2 text-sm text-zinc-500">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
