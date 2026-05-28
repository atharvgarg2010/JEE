import { isTeacherUser, requireTeacher } from "@/lib/auth/teacher";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getStudentModuleAnalyticsForTeacher } from "@/lib/db/modules";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/students/[studentId]/module-analytics
 *
 * Returns per-module aggregated offline-log analytics for a specific student.
 * Access-gated: teacher must share a batch with the student.
 *
 * Response shape:
 *   { success: true, analytics: StudentModuleAnalyticsRow[] }
 *
 * Sorted: lowest completion first → most doubts → most recently updated.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

  const { studentId } = await params;

  if (!studentId) {
    return jsonError("Missing studentId", 400);
  }

  try {
    const analytics = await getStudentModuleAnalyticsForTeacher(
      user.id,
      studentId,
    );
    return jsonSuccess({ analytics });
  } catch (error) {
    console.error("[teacher/students/[studentId]/module-analytics GET]", error);
    return jsonError("Failed to load module analytics", 500);
  }
}
