import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { findUserById } from "@/lib/db/users";

export async function generateMetadata({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return { title: `Student ${studentId} | JEE Tracker` };
}

export default async function TeacherStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") return null;

  const { studentId } = await params;
  const student = await findUserById(studentId);
  if (!student) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/teacher/dashboard"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-violet-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="rounded-3xl border border-zinc-800/60 bg-zinc-900/40 p-6">
        <h1 className="text-2xl font-semibold text-white">Student profile</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Basic student details and recent teacher notes.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Name</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {student.full_name ?? student.username}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Username</p>
            <p className="mt-2 text-lg font-semibold text-white">{student.username}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Roll number</p>
            <p className="mt-2 text-lg font-semibold text-white">{student.roll_number ?? "N/A"}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Batch code</p>
            <p className="mt-2 text-lg font-semibold text-white">{student.batch_code ?? "N/A"}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4 text-sm text-zinc-300">
          <p className="font-medium text-white">Student ID</p>
          <p className="mt-1 break-all">{student.id}</p>
        </div>
      </div>
    </div>
  );
}
