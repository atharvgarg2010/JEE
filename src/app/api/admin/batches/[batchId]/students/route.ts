import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { jsonSuccess } from "@/lib/api/response";
import { getBatchStudents, reassignStudentBatch } from "@/lib/db/batches";
import { withApiErrorHandler } from "@/lib/api/error";
import { parseRequestBody } from "@/lib/api/validation";
import { verifyCsrf } from "@/lib/api/csrf";
import { rateLimit } from "@/lib/api/rate-limit";
import { withTimeout } from "@/lib/api/timeout";
import { logAuditAction } from "@/lib/db/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const reassignSchema = z.object({
  student_id: z.string().uuid(),
}).strict();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  return withApiErrorHandler(async (req) => {
    const user = await requireAdmin();
    if (!isAdminUser(user)) return user;

    const { batchId } = await params;
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));

    const result = await withTimeout(getBatchStudents(batchId, page, limit));
    return jsonSuccess(result);
  }, request);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 20, windowMs: 60 * 1000, identifier: `admin_batch_students_post:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await requireAdmin();
    if (!isAdminUser(user)) return user;

    const { batchId } = await params;
    const data = await parseRequestBody(req, reassignSchema);

    await withTimeout(reassignStudentBatch(data.student_id, batchId));

    await logAuditAction({
      actorId: user.id,
      actorRole: user.role,
      action: "REASSIGN_STUDENT",
      entityType: "batch_students",
      entityId: data.student_id,
      metadata: { newBatchId: batchId, reqUrl: req.url },
    });

    return jsonSuccess({ reassigned: true });
  }, request);
}
