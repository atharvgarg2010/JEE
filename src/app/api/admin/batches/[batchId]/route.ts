import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import {
  getBatchById,
  getBatchTeachers,
  softDeleteBatch,
  updateBatch,
} from "@/lib/db/batches";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateBatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
});

/** GET /api/admin/batches/[batchId] — batch detail with teachers */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const user = await requireAdmin();
  if (!isAdminUser(user)) return user;

  const { batchId } = await params;

  try {
    const [batch, teachers] = await Promise.all([
      getBatchById(batchId),
      getBatchTeachers(batchId),
    ]);

    if (!batch) return jsonError("Batch not found", 404);

    return jsonSuccess({ batch, teachers });
  } catch (error) {
    console.error("[admin/batches/[batchId] GET]", error);
    return jsonError("Failed to load batch", 500);
  }
}

/** PATCH /api/admin/batches/[batchId] — update batch metadata */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const user = await requireAdmin();
  if (!isAdminUser(user)) return user;

  const { batchId } = await params;

  try {
    const body = await request.json();
    const parsed = updateBatchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const batch = await updateBatch(batchId, parsed.data);
    if (!batch) return jsonError("Batch not found", 404);

    return jsonSuccess({ batch });
  } catch (error) {
    console.error("[admin/batches/[batchId] PATCH]", error);
    return jsonError("Failed to update batch", 500);
  }
}

/** DELETE /api/admin/batches/[batchId] — soft-delete (is_active = false) */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const user = await requireAdmin();
  if (!isAdminUser(user)) return user;

  const { batchId } = await params;

  try {
    const ok = await softDeleteBatch(batchId);
    if (!ok) return jsonError("Batch not found", 404);
    return jsonSuccess({ deleted: true });
  } catch (error) {
    console.error("[admin/batches/[batchId] DELETE]", error);
    return jsonError("Failed to deactivate batch", 500);
  }
}
