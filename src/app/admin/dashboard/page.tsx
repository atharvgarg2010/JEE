import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminDashboardStats } from "@/lib/db/admin-analytics";
import { listBatchesWithStats } from "@/lib/db/batches";
import {
  Users, BookOpen, Layers, AlertCircle,
  Activity, GraduationCap, BarChart2, Megaphone
} from "lucide-react";
import Link from "next/link";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

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
      <div className="rounded-md border border-zinc-800 bg-zinc-900 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Admin Command Center
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage batches, teachers, and students across your entire institute.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            View Analytics
          </Link>
          <Link
            href="/admin/batches/new"
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            + New Batch
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map(({ label, value, total, icon: Icon, href }) => {
          const card = (
            <div className={`flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 p-4 transition-colors ${href ? "hover:bg-zinc-800/50 cursor-pointer" : ""}`}>
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
                <p className={`mt-1 text-2xl font-bold text-zinc-100`}>{value}</p>
                {total !== undefined && (
                  <p className="mt-1 text-xs text-zinc-600">{total} total</p>
                )}
              </div>
              <Icon className="h-6 w-6 text-indigo-400 opacity-80" />
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
        <div className="w-full">
          {activeBatches.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center rounded-md border border-zinc-800 bg-zinc-900/50">
              <Layers className="mb-3 h-10 w-10 text-zinc-700" />
              <p className="text-sm text-zinc-500">No active batches yet.</p>
              <Link
                href="/admin/batches/new"
                className="mt-3 text-sm font-medium text-indigo-400 hover:text-indigo-300"
              >
                Create your first batch →
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Students</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Teachers</TableHead>
                  <TableHead className="text-right">Avg Accuracy</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Doubts</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeBatches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <p className="font-medium text-zinc-100">{b.name}</p>
                      <p className="text-xs text-zinc-500">{b.code}</p>
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-400 hidden sm:table-cell">{b.student_count}</TableCell>
                    <TableCell className="text-right font-mono hidden sm:table-cell">
                      <span className={`${b.teacher_count >= 3 ? "text-indigo-400" : "text-amber-400"}`}>
                        {b.teacher_count}/3
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {b.avg_accuracy !== null ? (
                        <span className={`${b.avg_accuracy >= 70 ? "text-indigo-400" : b.avg_accuracy >= 50 ? "text-amber-400" : "text-red-400"}`}>
                          {b.avg_accuracy}%
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono hidden md:table-cell">
                      {b.doubts_pending > 0 ? (
                        <span className="text-red-400 font-semibold">{b.doubts_pending}</span>
                      ) : (
                        <span className="text-zinc-600">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/batches/${b.id}`} className="text-xs text-indigo-400 hover:text-indigo-300">
                        Manage →
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            className="rounded-md border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:bg-zinc-800/50"
          >
            <c.icon className={`mb-3 h-6 w-6 text-indigo-400`} />
            <h3 className="font-semibold text-white">{c.title}</h3>
            <p className="mt-1 text-sm text-zinc-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
