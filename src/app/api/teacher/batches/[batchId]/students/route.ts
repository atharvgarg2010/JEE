import { isTeacherUser, requireTeacher } from "@/lib/auth/teacher";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getBatchStudents } from "@/lib/db/batches";
import { getPool } from "@/lib/db/postgres";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/batches/[batchId]/students?page=1&limit=50
 * List students enrolled in a batch.
 * Gated: Teacher must be assigned to this batch.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

  const { batchId } = await params;
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10))
  );

  try {
    const pool = getPool();
    // Verify teacher is assigned to this batch
    const { rows } = await pool.query(
      `SELECT 1 FROM batch_teachers WHERE batch_id = $1 AND teacher_id = $2`,
      [batchId, user.id]
    );

    if (rows.length === 0) {
      return jsonError("Batch not found or access denied", 403);
    }

    const result = await getBatchStudents(batchId, page, limit);
    return jsonSuccess(result);
  } catch (error) {
    console.error("[teacher/batches/[batchId]/students GET]", error);
    return jsonError("Failed to load students", 500);
  }
}
