import { isTeacherUser, requireTeacher } from "@/lib/auth/teacher";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getTeacherStudentAnalytics } from "@/lib/db/teacher-student-analytics";
import { getTeacherStudentAnalyticsByBatch } from "@/lib/db/teacher-student-analytics-batch";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/student-analytics?batchId=<uuid>
 *
 * Without batchId: returns legacy global analytics scoped to teacher's questions.
 * With batchId:    returns batch-scoped analytics for students in that batch only.
 *
 * Backward-compatible: existing clients that don't send batchId continue working.
 */
export async function GET(request: Request) {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

  const batchId = new URL(request.url).searchParams.get("batchId") ?? undefined;

  try {
    const analytics = batchId
      ? await getTeacherStudentAnalyticsByBatch(user.id, batchId)
      : await getTeacherStudentAnalytics(user.id);

    return jsonSuccess({ analytics });
  } catch (error) {
    console.error("[teacher/student-analytics]", error);
    return jsonError("Failed to load student analytics", 500);
  }
}
