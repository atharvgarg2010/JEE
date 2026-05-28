import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { jsonSuccess } from "@/lib/api/response";
import { createBatch, listBatchesWithStats } from "@/lib/db/batches";
import { withApiErrorHandler, ValidationError } from "@/lib/api/error";
import { parseRequestBody } from "@/lib/api/validation";
import { verifyCsrf } from "@/lib/api/csrf";
import { rateLimit } from "@/lib/api/rate-limit";
import { withTimeout } from "@/lib/api/timeout";
import { logAuditAction } from "@/lib/db/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createBatchSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/i, "Code must be alphanumeric"),
  description: z.string().max(500).optional(),
}).strict();

export async function GET(request: Request) {
  return withApiErrorHandler(async (req) => {
    const user = await requireAdmin();
    if (!isAdminUser(user)) return user;

    const batches = await withTimeout(listBatchesWithStats());
    return jsonSuccess({ batches });
  }, request);
}

export async function POST(request: Request) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 10, windowMs: 60 * 1000, identifier: `admin_batches_post:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await requireAdmin();
    if (!isAdminUser(user)) return user;

    const data = await parseRequestBody(req, createBatchSchema);

    let batch;
    try {
      batch = await withTimeout(createBatch({
        name: data.name,
        code: data.code,
        description: data.description,
      }));
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "23505"
      ) {
        throw new ValidationError("A batch with that code already exists");
      }
      throw error;
    }

    await logAuditAction({
      actorId: user.id,
      actorRole: user.role,
      action: "CREATE_BATCH",
      entityType: "batches",
      entityId: batch.id,
      metadata: { reqUrl: req.url },
    });

    return jsonSuccess({ batch }, 201);
  }, request);
}
