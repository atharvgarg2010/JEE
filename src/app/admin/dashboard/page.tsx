import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminDashboardStats } from "@/lib/db/admin-analytics";
import { listBatchesWithStats } from "@/lib/db/batches";
import {
  Users, BookOpen, Layers, AlertCircle,
  Activity, GraduationCap, BarChart2, Megaphone
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Admin Dashboard | JEE Tracker",
};

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login/admin");

  const [stats, batches] = await Promise.all([
    getAdminDashboardStats(),
    listBatchesWithStats(),
  ]);

  const activeBatches = batches.filter((b) => b.is_active).slice(0, 5);

  const kpiCards = [
    {
      label: "Active Batches",
      value: stats.active_batches,
      total: stats.total_batches,
      icon: Layers,
      accent: "text-violet-400",
      bg: "bg-violet-500/10",
      href: "/admin/batches",
    },
    {
      label: "Students",
      value: stats.total_students,
      icon: GraduationCap,
      accent: "text-cyan-400",
      bg: "bg-cyan-500/10",
      href: "/admin/users?role=student",
    },
    {
      label: "Teachers",
      value: stats.total_teachers,
      icon: Users,
      accent: "text-fuchsia-400",
      bg: "bg-fuchsia-500/10",
      href: "/admin/users?role=teacher",
    },
    {
      label: "Questions",
      value: stats.total_questions,
      icon: BookOpen,
      accent: "text-amber-400",
      bg: "bg-amber-500/10",
      href: null,
    },
    {
      label: "Open Doubts",
      value: stats.total_doubts_unresolved,
      icon: AlertCircle,
      accent: stats.total_doubts_unresolved > 20 ? "text-red-400" : "text-emerald-400",
      bg: stats.total_doubts_unresolved > 20 ? "bg-red-500/10" : "bg-emerald-500/10",
      href: null,
    },
    {
      label: "Total Attempts",
      value: stats.total_attempts.toLocaleString(),
      icon: Activity,
      accent: "text-blue-400",
      bg: "bg-blue-500/10",
      href: "/admin/analytics?view=students",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/50 via-zinc-900/80 to-zinc-950 p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" aria-hidden />
        <div className="relative">
          <p className="mb-2 flex items-center gap-2 text-sm text-violet-300">
            <BarChart2 className="h-4 w-4" />
            Admin Command Center
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Platform Overview
          </h1>
          <p className="mt-3 max-w-xl text-zinc-400">
            Manage batches, teachers, and students across your entire institute.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/batches/new"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              + New Batch
            </Link>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-violet-500/40"
            >
              View Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map(({ label, value, total, icon: Icon, accent, bg, href }) => {
          const card = (
            <div className={`rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm transition-colors ${href ? "hover:border-violet-500/30 cursor-pointer" : ""}`}>
              <div className={`mb-3 inline-flex rounded-xl p-2 ${bg}`}>
                <Icon className={`h-5 w-5 ${accent}`} />
              </div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
              <p className={`mt-1 text-3xl font-bold text-white`}>{value}</p>
              {total !== undefined && (
                <p className="mt-1 text-xs text-zinc-600">{total} total</p>
              )}
            </div>
          );
          return href ? (
            <Link key={label} href={href}>{card}</Link>
          ) : (
            <div key={label}>{card}</div>
          );
        })}
      </div>

      {/* Active Batches Quick View */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Active Batches</h2>
          <Link href="/admin/batches" className="text-sm text-violet-400 hover:text-violet-300">
            View all →
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50">
          {activeBatches.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Layers className="mb-3 h-10 w-10 text-zinc-700" />
              <p className="text-sm text-zinc-500">No active batches yet.</p>
              <Link
                href="/admin/batches/new"
                className="mt-3 text-sm font-medium text-violet-400 hover:text-violet-300"
              >
                Create your first batch →
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/80">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Batch</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Students</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Teachers</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Avg Accuracy</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Doubts</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {activeBatches.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-zinc-800/30">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-white">{b.name}</p>
                      <p className="text-xs text-zinc-500">{b.code}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right text-zinc-300">{b.student_count}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-sm font-medium ${b.teacher_count >= 3 ? "text-emerald-400" : "text-amber-400"}`}>
                        {b.teacher_count}/3
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {b.avg_accuracy !== null ? (
                        <span className={`font-medium ${b.avg_accuracy >= 70 ? "text-emerald-400" : b.avg_accuracy >= 50 ? "text-amber-400" : "text-red-400"}`}>
                          {b.avg_accuracy}%
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {b.doubts_pending > 0 ? (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400">
                          {b.doubts_pending}
                        </span>
                      ) : (
                        <span className="text-zinc-600">0</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <Link
                        href={`/admin/batches/${b.id}`}
                        className="text-xs text-zinc-500 hover:text-violet-400"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: "Manage Batches", desc: "Create, edit, assign teachers to batches", href: "/admin/batches", icon: Layers, color: "text-violet-400" },
          { title: "Manage Users", desc: "View students and teachers, move students", href: "/admin/users", icon: Users, color: "text-cyan-400" },
          { title: "Analytics", desc: "Cross-batch performance and teacher load", href: "/admin/analytics", icon: BarChart2, color: "text-amber-400" },
        ].map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 transition-colors hover:border-violet-500/40"
          >
            <c.icon className={`mb-3 h-6 w-6 ${c.color}`} />
            <h3 className="font-semibold text-white">{c.title}</h3>
            <p className="mt-1 text-sm text-zinc-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
