import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { getPool } from "@/lib/db/postgres";
import { OfflineModuleAnalyticsSection } from "@/components/dashboard/offline-module-analytics";

export const dynamic = "force-dynamic";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const user = await requireAdmin();
  if (!isAdminUser(user)) return notFound();

  const { studentId } = await params;
  const pool = getPool();

  // Fetch student details
  const { rows } = await pool.query<{
    id: string;
    username: string;
    full_name: string | null;
    roll_number: string | null;
    batch_code: string | null;
    batch_name: string | null;
  }>(
    `SELECT
       u.id,
       u.username,
       u.full_name,
       u.roll_number,
       u.batch_code,
       b.name AS batch_name
     FROM users u
     LEFT JOIN batch_students bs ON bs.student_id = u.id
     LEFT JOIN batches b ON b.id = bs.batch_id
     WHERE u.id = $1
       AND u.role = 'student'
     LIMIT 1`,
     [studentId],
  );

  const student = rows[0];

  if (!student) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <AlertCircle className="mb-3 h-8 w-8 text-zinc-700" />
        <p className="text-sm text-zinc-500">Student not found or access denied.</p>
        <Link
          href="/admin/users"
          className="mt-3 text-xs text-indigo-400 hover:text-indigo-300"
        >
          ← Back to users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Link>

      {/* Profile card */}
      <div className="rounded border border-zinc-800/60 bg-zinc-900/40 p-5">
        <h1 className="text-lg font-semibold text-white">
          {student.full_name ?? student.username}
        </h1>
        <p className="mt-0.5 text-xs text-zinc-500">@{student.username}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Roll No.", value: student.roll_number ?? "N/A" },
            { label: "Batch Name", value: student.batch_name ?? "N/A" },
            { label: "Role", value: "Student" },
            { label: "ID", value: student.id.slice(0, 8) + "…" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded border border-zinc-800/60 bg-zinc-950/40 px-3 py-2"
            >
              <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                {label}
              </p>
              <p className="mt-1 font-mono text-xs font-medium text-zinc-200 break-all">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Offline Module Progress */}
        <OfflineModuleAnalyticsSection studentId={studentId} role="admin" />
      </div>
    </div>
  );
}
