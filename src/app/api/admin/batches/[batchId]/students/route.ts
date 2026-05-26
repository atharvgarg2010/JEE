import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getBatchStudents, reassignStudentBatch } from "@/lib/db/batches";
import { z } from "zod";

export const dynamic = "force-dynamic";

const reassignSchema = z.object({
  student_id: z.string().uuid(),
});

/**
 * GET /api/admin/batches/[batchId]/students?page=1&limit=50
 * List students enrolled in a batch.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const user = await requireAdmin();
  if (!isAdminUser(user)) return user;

  const { batchId } = await params;
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));

  try {
    const result = await getBatchStudents(batchId, page, limit);
    return jsonSuccess(result);
  } catch (error) {
    console.error("[admin/batches/[batchId]/students GET]", error);
    return jsonError("Failed to load students", 500);
  }
}

/**
 * POST /api/admin/batches/[batchId]/students
 * Move a student INTO this batch (reassign from their current batch).
 * Body: { student_id }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const user = await requireAdmin();
  if (!isAdminUser(user)) return user;

  const { batchId } = await params;

  try {
    const body = await request.json();
    const parsed = reassignSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("student_id (UUID) required", 400);
    }

    await reassignStudentBatch(parsed.data.student_id, batchId);
    return jsonSuccess({ reassigned: true });
  } catch (error: unknown) {
    console.error("[admin/batches/[batchId]/students POST]", error);
    const msg = error instanceof Error ? error.message : "Failed to reassign student";
    return jsonError(msg, 500);
  }
}
