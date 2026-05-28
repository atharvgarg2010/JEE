import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getStudentModuleAnalyticsForAdmin } from "@/lib/db/modules";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users/[studentId]/module-analytics
 *
 * Returns per-module aggregated offline-log analytics for a specific student.
 * Gated: Admin access only.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const user = await requireAdmin();
  if (!isAdminUser(user)) return user;

  const { studentId } = await params;

  if (!studentId) {
    return jsonError("Missing studentId", 400);
  }

  try {
    const analytics = await getStudentModuleAnalyticsForAdmin(studentId);
    return jsonSuccess({ analytics });
  } catch (error) {
    console.error("[admin/users/[studentId]/module-analytics GET]", error);
    return jsonError("Failed to load module analytics", 500);
  }
}
