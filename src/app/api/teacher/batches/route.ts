import { isTeacherUser, requireTeacher } from "@/lib/auth/teacher";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getTeacherBatches } from "@/lib/db/batches";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/batches
 * Returns all batches the authenticated teacher is assigned to.
 * Used by BatchOverviewPanel and BatchSelectorBar.
 */
export async function GET() {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

  try {
    const batches = await getTeacherBatches(user.id);
    return jsonSuccess({ batches });
  } catch (error) {
    console.error("[teacher/batches GET]", error);
    return jsonError("Failed to load batches", 500);
  }
}
